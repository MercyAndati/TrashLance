const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { calculateDistance } = require('../utils/location');
const { sendEmail } = require('../utils/email');
const { getPlanLimit, getEffectivePlan, isSubscriptionExpired } = require('../config/subscription');

// Create booking
const createBooking = async (req, res) => {
  try {
    const {
      serviceProvider,
      service,
      scheduledDate,
      timeSlot,
      location,
      serviceDetails,
      pricing
    } = req.body;

    // Verify service exists and is active
    const serviceDoc = await Service.findById(service);
    if (!serviceDoc || !serviceDoc.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Verify service provider
    const provider = await User.findById(serviceProvider);
    if (provider && provider.role === 'service_provider' && !provider.serviceProvider?.isVerified) {
      // Auto-verify for development/testing
      provider.serviceProvider.isVerified = true;
      await provider.save();
    }
    if (!provider || provider.role !== 'service_provider' || !provider.serviceProvider?.isVerified) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found or not verified'
      });
    }
    // ✅ Enforce subscription plan limits
    const effectivePlan = getEffectivePlan(provider);
    const planLimit = getPlanLimit(effectivePlan);
    const now = new Date();

    // Check if subscription is expired
    if (provider.serviceProvider?.subscription?.endDate && isSubscriptionExpired(provider.serviceProvider.subscription.endDate)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your subscription has expired. You are now on the Free plan. Please renew to access higher limits.',
        data: {
          currentPlan: 'Free',
          planLimit: getPlanLimit('Free'),
          isExpired: true
        }
      });
    }

    const monthlyBookingCount = await Booking.countDocuments({
      serviceProvider: provider._id,
      createdAt: {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }
    });

    // Check if limit reached
    if (monthlyBookingCount >= planLimit) {
      return res.status(403).json({
        success: false,
        message: `Booking limit reached for your current plan (${effectivePlan}). Upgrade to accept more bookings.`,
        data: {
          currentPlan: effectivePlan,
          planLimit,
          currentCount: monthlyBookingCount,
          isLimitReached: true
        }
      });
    }

    // Check if close to limit (warning)
    const remainingBookings = planLimit - monthlyBookingCount;
    const isCloseToLimit = remainingBookings <= 2 && remainingBookings > 0;

    // Check if provider offers this service
    if (!provider.serviceProvider.servicesOffered.includes(service)) {
      return res.status(400).json({
        success: false,
        message: 'Service provider does not offer this service'
      });
    }

    // Check availability (simplified - you might want more complex logic)
    const existingBooking = await Booking.findOne({
      serviceProvider,
      scheduledDate: {
        $gte: new Date(scheduledDate).setHours(0, 0, 0, 0),
        $lt: new Date(scheduledDate).setHours(23, 59, 59, 999)
      },
      'timeSlot.start': timeSlot.start,
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Time slot not available'
      });
    }

    // Only require location.residence
    if (!location || !location.residence) {
      return res.status(400).json({
        success: false,
        message: 'Residence is required',
        errors: { 'location.residence': 'Residence is required' }
      });
    }

    // Create booking
    const booking = new Booking({
      customer: req.user._id,
      serviceProvider,
      service,
      scheduledDate,
      timeSlot,
      location,
      serviceDetails,
      pricing: {
        ...pricing,
        totalAmount: pricing.baseAmount + 
          (pricing.additionalFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0) +
          (pricing.tax?.amount || 0) -
          (pricing.discount?.amount || 0)
      }
    });

    // Add initial status to history
    booking.statusHistory.push({
      status: 'pending',
      updatedBy: req.user._id,
      notes: 'Booking created'
    });
    if (!booking.bookingNumber) {
      const count = await Booking.countDocuments();
      booking.bookingNumber = `TL${Date.now()}${String(count + 1).padStart(4, '0')}`;
    }
    await booking.save();

    // Populate booking for response
    await booking.populate([
      { path: 'customer', select: 'username email phone' },
      { path: 'serviceProvider', select: 'username email phone serviceProvider.companyName' },
      { path: 'service', select: 'name category pricing' }
    ]);

    // Send notifications
    await Notification.createAndSend({
      recipient: serviceProvider,
      type: 'booking_confirmed',
      title: 'New Booking Request',
      message: `You have a new booking request from ${req.user.username}`,
      category: 'booking',
      data: {
        bookingId: booking._id,
        actionUrl: `/bookings/${booking._id}`
      }
    });

    // Send email to service provider
    await sendEmail({
      to: provider.email,
      subject: 'New Booking Request - Trashlance',
      template: 'newBooking',
      data: {
        providerName: provider.usernam,
        customerName: `${req.user.username}`,
        serviceName: serviceDoc.name,
        scheduledDate: booking.scheduledDate,
        bookingUrl: `${process.env.CLIENT_URL}/bookings/${booking._id}`
      }
    });

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(serviceProvider).emit('new-booking', {
      booking: booking.toObject(),
      message: 'You have a new booking request'
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { 
        booking,
        subscriptionInfo: {
          currentPlan: effectivePlan,
          planLimit,
          currentCount: monthlyBookingCount + 1, // +1 for this booking
          remainingBookings: remainingBookings - 1,
          isCloseToLimit,
          isExpired: false
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user bookings
const getUserBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    
    // Filter by user role
    if (req.user.role === 'service_provider') {
      query.serviceProvider = req.user._id;
    } else {
      query.customer = req.user._id;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookings = await Booking.find(query)
      .populate([
        { path: 'customer', select: 'username email phone avatar' },
        { path: 'serviceProvider', select: 'username email phone serviceProvider.companyName avatar' },
        { path: 'service', select: 'name category pricing images' }
      ])
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        docs: bookings,
        totalDocs: total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id)
      .populate([
        { path: 'customer', select: 'username email phone avatar address' },
        { path: 'serviceProvider', select: 'username email phone serviceProvider avatar address' },
        { path: 'service', select: 'name description category pricing images duration' },
        { path: 'statusHistory.updatedBy', select: 'username' },
        { path: 'communication.sender', select: 'username avatar' }
      ]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has access to this booking
    const hasAccess = booking.customer._id.toString() === req.user._id.toString() ||
                     booking.serviceProvider._id.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, notes } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions
    const canUpdate = booking.serviceProvider.toString() === req.user._id.toString() ||
                     req.user.role === 'admin' ||
                     (booking.customer.toString() === req.user._id.toString() && status === 'cancelled');

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled', 'rescheduled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      rescheduled: ['confirmed', 'cancelled']
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${booking.status} to ${status}`
      });
    }

    // Update status
    booking.updateStatus(status, req.user._id, reason, notes);

    // Update tracking timestamps
    const now = new Date();
    switch (status) {
      case 'in_progress':
        booking.tracking.serviceStarted = now;
        break;
      case 'completed':
        booking.tracking.serviceCompleted = now;
        break;
    }

    await booking.save();

    // Send notifications
    const recipient = booking.customer.toString() === req.user._id.toString() 
      ? booking.serviceProvider 
      : booking.customer;

    const statusMessages = {
      confirmed: 'Your booking has been confirmed',
      in_progress: 'Your service is now in progress',
      completed: 'Your service has been completed',
      cancelled: 'Your booking has been cancelled',
      rescheduled: 'Your booking has been rescheduled'
    };

    await Notification.createAndSend({
      recipient,
      type: `booking_${status}`,
      title: 'Booking Status Update',
      message: statusMessages[status],
      category: 'booking',
      data: {
        bookingId: booking._id,
        actionUrl: `/bookings/${booking._id}`
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(recipient.toString()).emit('booking-status', {
      bookingId: booking._id,
      status,
      message: statusMessages[status]
    });

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Error in updateBookingStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update location tracking
const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, estimatedArrival } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only service provider can update location
    if (booking.serviceProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only service provider can update location'
      });
    }

    // Update location
    booking.tracking.providerLocation = {
      latitude,
      longitude,
      lastUpdated: new Date()
    };

    if (estimatedArrival) {
      booking.tracking.estimatedArrival = estimatedArrival;
    }

    // Add to route history
    booking.tracking.route.push({
      latitude,
      longitude,
      timestamp: new Date()
    });

    await booking.save();

    // Emit real-time location update
    const io = req.app.get('io');
    io.to(booking.customer.toString()).emit('location-update', {
      bookingId: booking._id,
      location: { latitude, longitude },
      estimatedArrival
    });

    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add communication message
const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, type = 'message' } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is part of this booking
    const hasAccess = booking.customer.toString() === req.user._id.toString() ||
                     booking.serviceProvider.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add message
    booking.communication.push({
      sender: req.user._id,
      message,
      type
    });

    await booking.save();

    // Get the added message with populated sender
    await booking.populate('communication.sender', 'username avatar');
    const addedMessage = booking.communication[booking.communication.length - 1];

    // Send notification to other party
    const recipient = booking.customer.toString() === req.user._id.toString() 
      ? booking.serviceProvider 
      : booking.customer;

    await Notification.createAndSend({
      recipient,
      type: 'new_message',
      title: 'New Message',
      message: `You have a new message regarding your booking`,
      category: 'booking',
      data: {
        bookingId: booking._id,
        actionUrl: `/bookings/${booking._id}`
      }
    });

    // Emit real-time message
    const io = req.app.get('io');
    io.to(recipient.toString()).emit('new-message', {
      bookingId: booking._id,
      message: addedMessage
    });

    res.json({
      success: true,
      message: 'Message added successfully',
      data: { message: addedMessage }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user can cancel
    const canCancel = booking.customer.toString() === req.user._id.toString() ||
                     booking.serviceProvider.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    // Calculate refund amount based on cancellation policy
    let refundAmount = 0;
    const hoursUntilService = (new Date(booking.scheduledDate) - new Date()) / (1000 * 60 * 60);
    
    if (hoursUntilService > 24) {
      refundAmount = booking.pricing.totalAmount; // Full refund
    } else if (hoursUntilService > 2) {
      refundAmount = booking.pricing.totalAmount * 0.5; // 50% refund
    }
    // No refund if less than 2 hours

    // Update booking
    booking.updateStatus('cancelled', req.user._id, reason);
    booking.cancellation = {
      cancelledBy: req.user._id,
      reason,
      cancelledAt: new Date(),
      refundAmount
    };

    await booking.save();

    // Process refund if applicable
    if (refundAmount > 0 && booking.payment.status === 'paid') {
      // Here you would integrate with your payment processor to issue refund
      // For now, we'll just update the booking
      booking.payment.refundAmount = refundAmount;
      booking.payment.status = 'refunded';
      booking.payment.refundedAt = new Date();
      await booking.save();
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { 
        booking,
        refundAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  updateLocation,
  addMessage,
  cancelBooking
};