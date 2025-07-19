import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

const paymentMethods = [
  { id: "cash", label: "Cash" },
  { id: "mpesa", label: "M-Pesa" },
  { id: "card", label: "Card" },
];

const steps = [
  "Select Service",
  "Pick Date & Time",
  "Enter Residence",
  "Payment Method",
  "Review & Confirm",
];

const BookingCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get("provider");
  const [services, setServices] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    serviceId: "",
    date: "",
    timeStart: "",
    timeEnd: "",
    residence: "",
    paymentMethod: "cash",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch real services for the provider
  useEffect(() => {
    if (providerId) {
      api.get(`/users/${providerId}/services`).then(res => {
        setServices(res.data.data || []);
      }).catch(() => setServices([]));
    }
  }, [providerId]);

  // Step 1: Select Service
  const renderSelectService = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Select a Service</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <div
            key={service._id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              form.serviceId === service._id ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-300 dark:border-gray-600 hover:border-green-300"
            }`}
            onClick={() => setForm((prev) => ({ ...prev, serviceId: service._id }))}
          >
            <h3 className="font-medium text-gray-900 dark:text-white">{service.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{service.description}</p>
            <span className="text-green-700 dark:text-green-300 font-semibold">
              Ksh {service.pricing?.basePrice} / {service.pricing?.unit}
            </span>
            {fieldErrors.service && (
              <div className="text-red-600 text-xs mt-2">{fieldErrors.service}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Step 2: Pick Date & Time
  const renderDateTime = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Pick Date & Time</h2>
      <div>
        <label className="block mb-2 font-medium">Date</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
          className="input-field"
        />
        {fieldErrors.scheduledDate && (
          <div className="text-red-600 text-xs mt-1">{fieldErrors.scheduledDate}</div>
        )}
      </div>
      <div className="flex space-x-4">
        <div>
          <label className="block mb-2 font-medium">Start Time</label>
          <input
            type="time"
            value={form.timeStart}
            onChange={(e) => setForm((prev) => ({ ...prev, timeStart: e.target.value }))}
            className="input-field"
          />
          {fieldErrors["timeSlot.start"] && (
            <div className="text-red-600 text-xs mt-1">{fieldErrors["timeSlot.start"]}</div>
          )}
        </div>
        <div>
          <label className="block mb-2 font-medium">End Time</label>
          <input
            type="time"
            value={form.timeEnd}
            onChange={(e) => setForm((prev) => ({ ...prev, timeEnd: e.target.value }))}
            className="input-field"
          />
          {fieldErrors["timeSlot.end"] && (
            <div className="text-red-600 text-xs mt-1">{fieldErrors["timeSlot.end"]}</div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 3: Enter Residence
  const renderLocation = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Enter Your Residence</h2>
      <div className="space-y-2">
        <label className="block font-medium mb-1">Residence (e.g., Freetown opposite Otomat)</label>
        <input
          type="text"
          placeholder="Enter your residence"
          value={form.residence || ''}
          onChange={e => setForm(prev => ({ ...prev, residence: e.target.value }))}
          className="input-field"
          required
        />
        {fieldErrors["location.residence"] && (
          <div className="text-red-600 text-xs mt-1">{fieldErrors["location.residence"]}</div>
        )}
      </div>
    </div>
  );

  // Step 4: Payment Method
  const renderPayment = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
      <div className="flex flex-col space-y-3">
        {paymentMethods.map((method) => (
          <label key={method.id} className="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={form.paymentMethod === method.id}
              onChange={() => setForm((prev) => ({ ...prev, paymentMethod: method.id }))}
              className="mr-2"
            />
            {method.label}
          </label>
        ))}
        {fieldErrors.paymentMethod && (
          <div className="text-red-600 text-xs mt-1">{fieldErrors.paymentMethod}</div>
        )}
      </div>
    </div>
  );

  // Step 5: Review & Confirm
  const renderReview = () => {
    const selectedService = services.find((s) => s._id === form.serviceId);
    const paymentLabel = paymentMethods.find((m) => m.id === form.paymentMethod)?.label;
    console.log('Selected service pricing:', selectedService?.pricing);
    const bookingData = {
      serviceProvider: providerId,
      service: form.serviceId,
      scheduledDate: form.date,
      timeSlot: {
        start: form.timeStart,
        end: form.timeEnd,
      },
      location: {
        residence: form.residence
      },
      pricing: {
        baseAmount: selectedService?.pricing?.basePrice,
        unit: selectedService?.pricing?.unit,
        currency: selectedService?.pricing?.currency,
        additionalFees: [],
        discount: { amount: 0, reason: "" },
        tax: { amount: 0, rate: 0 },
        totalAmount: selectedService?.pricing?.basePrice
      },
      paymentMethod: form.paymentMethod,
      notes: "",
    };
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Review & Confirm</h2>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p><span className="font-semibold">Service:</span> {selectedService?.name}</p>
          <p><span className="font-semibold">Date:</span> {form.date}</p>
          <p><span className="font-semibold">Time:</span> {form.timeStart} - {form.timeEnd}</p>
          <p><span className="font-semibold">Residence:</span> {form.residence}</p>
          <p><span className="font-semibold">Payment Method:</span> {paymentLabel}</p>
          <p><span className="font-semibold">Price:</span> Ksh {selectedService?.pricing?.basePrice} / {selectedService?.pricing?.unit}</p>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          className="btn-primary w-full"
          onClick={async () => {
            setLoading(true);
            setError("");
            setFieldErrors({});
            try {
              console.log('Provider ID:', providerId);
              const response = await api.post("/bookings", bookingData);
              const newBookingId = response.data.data.booking?._id || response.data.data._id;
              navigate(`/bookings/${newBookingId}`);
            } catch (err) {
              const backendErrors = err.response?.data?.errors;
              if (Array.isArray(backendErrors)) {
                setError(backendErrors.map(e => {
                  if (typeof e === 'string') return e;
                  if (typeof e === 'object' && e !== null) return Object.values(e).join(' ');
                  return '';
                }).join(' | '));
                setFieldErrors({});
              } else if (backendErrors && typeof backendErrors === "object") {
                setFieldErrors(backendErrors);
                setError("");
              } else {
                setError(
                  err.response?.data?.message ||
                  err.message ||
                  "Failed to create booking. Please check your input and try again."
                );
              }
              console.log('Backend error:', err.response?.data);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          {loading ? "Booking..." : "Confirm Booking"}
        </button>
      </div>
    );
  };

  // Stepper UI
  const renderStepper = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${
                idx === currentStep
                  ? "bg-green-600"
                  : idx < currentStep
                  ? "bg-green-400"
                  : "bg-gray-300 dark:bg-gray-700"
              }`}
            >
              {idx + 1}
            </div>
            <span className={`mt-2 text-xs ${idx === currentStep ? "text-green-600" : "text-gray-500"}`}>{step}</span>
          </div>
          {idx < steps.length - 1 && (
            <div className="w-8 h-1 bg-gray-300 dark:bg-gray-700 mx-2 rounded-full" />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderSelectService();
      case 1:
        return renderDateTime();
      case 2:
        return renderLocation();
      case 3:
        return renderPayment();
      case 4:
        return renderReview();
      default:
        return null;
    }
  };

  // Validation for next button
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!form.serviceId;
      case 1:
        return !!form.date && !!form.timeStart && !!form.timeEnd;
      case 2:
        return !!form.residence;
      case 3:
        return !!form.paymentMethod;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-8">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
        {renderStepper()}
        {renderStepContent()}
        <div className="flex justify-between mt-8">
          <button
            className="btn-secondary"
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
            disabled={currentStep === 0 || loading}
          >
            Back
          </button>
          {currentStep < steps.length - 1 && (
            <button
              className="btn-primary"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={!canProceed() || loading}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCreate; 