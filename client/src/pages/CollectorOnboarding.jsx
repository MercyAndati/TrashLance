"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, Upload, MapPin, DollarSign, FileText, Star, Shield, Crown } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"

const CollectorOnboarding = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "",
    businessLicense: "",
    serviceRadius: 10,
    serviceLocations: "",
    workingHours: {
      monday: { available: true, start: "09:00", end: "17:00" },
      tuesday: { available: true, start: "09:00", end: "17:00" },
      wednesday: { available: true, start: "09:00", end: "17:00" },
      thursday: { available: true, start: "09:00", end: "17:00" },
      friday: { available: true, start: "09:00", end: "17:00" },
      saturday: { available: false, start: "09:00", end: "17:00" },
      sunday: { available: false, start: "09:00", end: "17:00" },
    },
    servicesOffered: [],
    subscription: "freemium",
    pricing: {
      type: "fixed",
      unit: "service",
      basePrice: "",
      currency: "Ksh",
      additionalFee: "",
      additionalFeeReason: "",
      additionalServices: [],
    },
    documents: {
      businessLicense: null,
      insurance: null,
      certifications: [],
    },
  })

  const steps = [
    { id: 1, title: "Business Info", icon: FileText },
    { id: 2, title: "Services", icon: MapPin },
    { id: 3, title: "Plan", icon: Star },
    { id: 4, title: "Pricing", icon: DollarSign },
    { id: 5, title: "Documents", icon: Upload },
    { id: 6, title: "Review", icon: CheckCircle },
  ]

  const subscriptionPlans = [
    {
      id: "freemium",
      name: "Freemium",
      icon: Star,
      description: "Basic access with limited features. Best for getting started.",
      features: ["Limited bookings", "Basic support", "No featured listing"],
    },
    {
      id: "standard",
      name: "Standard",
      icon: Shield,
      description: "Access to more features and higher booking limits.",
      features: ["More bookings", "Priority support", "Featured listing"],
    },
    {
      id: "premium",
      name: "Premium",
      icon: Crown,
      description: "All features unlocked, highest visibility and support.",
      features: ["Unlimited bookings", "24/7 support", "Top featured listing"],
    },
  ]

  const serviceTypes = [
    { id: "residential_pickup", name: "Residential Pickup", description: "Regular household waste collection" },
    { id: "commercial_pickup", name: "Commercial Pickup", description: "Business waste collection" },
    { id: "bulk_removal", name: "Bulk Item Removal", description: "Large item disposal service" },
    { id: "recycling", name: "Recycling Services", description: "Specialized recycling collection" },
    { id: "hazardous_waste", name: "Hazardous Waste", description: "Safe disposal of hazardous materials" },
    { id: "construction_debris", name: "Construction Debris", description: "Construction and demolition waste" },
  ]

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleWorkingHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value,
        },
      },
    }))
  }

  const handleServiceToggle = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(serviceId)
        ? prev.servicesOffered.filter((id) => id !== serviceId)
        : [...prev.servicesOffered, serviceId],
    }))
  }

  const handleFileUpload = (field, file) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file,
      },
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Send as JSON instead of FormData
      const { documents, ...submitData } = formData; // Remove documents field entirely

      // Log what's being sent
      console.log("Form data being sent:", submitData)

      const response = await api.post("/users/complete-onboarding", submitData, {
        headers: { "Content-Type": "application/json" },
      })

      updateUser(response.data.data)
      navigate("/dashboard")
    } catch (error) {
      console.error("Failed to complete onboarding:", error)
      console.error("Error response:", error.response?.data)
      alert(`Failed to complete onboarding: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const renderBusinessInfo = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Company/Business Name *
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => handleInputChange("companyName", e.target.value)}
          className="input-field w-full"
          placeholder="Enter your business name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Business License Number
        </label>
        <input
          type="text"
          value={formData.businessLicense}
          onChange={(e) => handleInputChange("businessLicense", e.target.value)}
          className="input-field w-full"
          placeholder="Enter your business license number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Radius (km) *</label>
        <input
          type="number"
          min="1"
          max="100"
          value={formData.serviceRadius}
          onChange={(e) => handleInputChange("serviceRadius", Number.parseInt(e.target.value))}
          className="input-field w-full"
          required
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">How far are you willing to travel for services?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Locations *</label>
        <input
          type="text"
          value={formData.serviceLocations}
          onChange={(e) => handleInputChange("serviceLocations", e.target.value)}
          className="input-field w-full"
          placeholder="e.g., Ruai, Kamulu, Stage 26"
          required
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enter all areas you serve, separated by commas.</p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Working Hours</h3>
        <div className="space-y-4">
          {Object.keys(formData.workingHours).map((day) => (
            <div key={day} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.workingHours[day].available}
                    onChange={(e) => handleWorkingHoursChange(day, "available", e.target.checked)}
                    className="mr-2"
                  />
                  <span className="capitalize font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                    {day}
                  </span>
                </label>
              </div>
              {formData.workingHours[day].available && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[40px]">From:</span>
                    <input
                      type="time"
                      value={formData.workingHours[day].start}
                      onChange={(e) => handleWorkingHoursChange(day, "start", e.target.value)}
                      className="input-field text-sm flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[40px]">To:</span>
                    <input
                      type="time"
                      value={formData.workingHours[day].end}
                      onChange={(e) => handleWorkingHoursChange(day, "end", e.target.value)}
                      className="input-field text-sm flex-1"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderServiceDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Services You Offer</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Select all services you can provide</p>

        <div className="grid grid-cols-1 gap-4">
          {serviceTypes.map((service) => (
            <div
              key={service.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.servicesOffered.includes(service.id)
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-green-300"
              }`}
              onClick={() => handleServiceToggle(service.id)}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.servicesOffered.includes(service.id)}
                  onChange={() => handleServiceToggle(service.id)}
                  className="text-green-600 mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{service.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{service.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSubscription = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Choose Your Subscription Plan</h3>
      <div className="grid grid-cols-1 gap-6">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`p-6 border rounded-lg shadow-sm transition-colors cursor-pointer ${
              formData.subscription === plan.id
                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
            }`}
            onClick={() => handleInputChange("subscription", plan.id)}
          >
            <div className="flex items-center mb-2">
              <plan.icon className="w-6 h-6 mr-2 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
            <ul className="text-sm text-gray-700 dark:text-gray-300 mb-4 list-disc pl-5">
              {plan.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            {formData.subscription === plan.id && (
              <div className="mt-2 text-blue-600 font-semibold">Selected</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const pricingTypes = [
    { value: "fixed", label: "Fixed (per service)" },
    { value: "per_hour", label: "Per Hour" },
    { value: "per_week", label: "Per Week" },
    { value: "per_month", label: "Per Month" },
    { value: "per_weight", label: "Per Weight (kg/ton)" },
    { value: "per_volume", label: "Per Volume (m³)" },
    { value: "custom", label: "Custom" },
  ]
  const pricingUnits = [
    { value: "service", label: "Service" },
    { value: "hour", label: "Hour" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "kg", label: "Kg" },
    { value: "ton", label: "Ton" },
    { value: "cubic_meter", label: "Cubic Meter" },
    { value: "bag", label: "Bag" },
    { value: "item", label: "Item" },
  ]

  const renderPricing = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pricing Type *</label>
        <select
          value={formData.pricing.type}
          onChange={(e) => setFormData((prev) => ({ ...prev, pricing: { ...prev.pricing, type: e.target.value } }))}
          className="input-field w-full"
        >
          {pricingTypes.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit *</label>
        <select
          value={formData.pricing.unit}
          onChange={(e) => setFormData((prev) => ({ ...prev, pricing: { ...prev.pricing, unit: e.target.value } }))}
          className="input-field w-full"
        >
          {pricingUnits.map((unit) => (
            <option key={unit.value} value={unit.value}>{unit.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Base Price (Ksh) *</label>
        <input
          type="number"
          min="0"
          value={formData.pricing.basePrice}
          onChange={(e) => setFormData((prev) => ({ ...prev, pricing: { ...prev.pricing, basePrice: e.target.value } }))}
          className="input-field w-full"
          placeholder="e.g., 40"
          required
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set your base price in Kenyan Shillings (Ksh).</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Fee (optional)</label>
        <input
          type="number"
          min="0"
          value={formData.pricing.additionalFee}
          onChange={(e) => setFormData((prev) => ({ ...prev, pricing: { ...prev.pricing, additionalFee: e.target.value } }))}
          className="input-field w-full"
          placeholder="e.g., 100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for Additional Fee (optional)</label>
        <input
          type="text"
          value={formData.pricing.additionalFeeReason}
          onChange={(e) => setFormData((prev) => ({ ...prev, pricing: { ...prev.pricing, additionalFeeReason: e.target.value } }))}
          className="input-field w-full"
          placeholder="e.g., Out of area pickup, hazardous waste, etc."
        />
      </div>
    </div>
  )

  const renderDocuments = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Required Documents</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Upload the following documents to verify your business (optional - you can skip and add later)</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Business License (optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm sm:text-base">
                {formData.documents.businessLicense
                  ? formData.documents.businessLicense.name
                  : "Upload business license"}
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload("businessLicense", e.target.files[0])}
                className="hidden"
                id="business-license"
              />
              <label htmlFor="business-license" className="btn-secondary cursor-pointer text-sm">
                Choose File
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Insurance Certificate
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm sm:text-base">
                {formData.documents.insurance ? formData.documents.insurance.name : "Upload insurance certificate"}
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload("insurance", e.target.files[0])}
                className="hidden"
                id="insurance"
              />
              <label htmlFor="insurance" className="btn-secondary cursor-pointer text-sm">
                Choose File
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReview = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Review Your Information</h3>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="space-y-3 text-sm sm:text-base">
          <p><span className="font-semibold">Business Name:</span> <span className="break-words">{formData.companyName}</span></p>
          <p><span className="font-semibold">Business License:</span> <span className="break-words">{formData.businessLicense}</span></p>
          <p><span className="font-semibold">Service Radius:</span> {formData.serviceRadius} km</p>
          <p><span className="font-semibold">Service Locations:</span> <span className="break-words">{formData.serviceLocations}</span></p>
          <div>
            <p className="font-semibold mb-2">Working Hours:</p>
            <ul className="ml-4 space-y-1 text-sm">
              {Object.entries(formData.workingHours).map(([day, hours]) => (
                <li key={day} className="break-words">
                  <span className="capitalize">{day}:</span> {hours.available ? `${hours.start} - ${hours.end}` : "Not available"}
                </li>
              ))}
            </ul>
          </div>
          <p><span className="font-semibold">Services Offered:</span> <span className="break-words">{formData.servicesOffered.join(", ")}</span></p>
          <p><span className="font-semibold">Subscription Plan:</span> {subscriptionPlans.find(p => p.id === formData.subscription)?.name}</p>
          <p><span className="font-semibold">Pricing:</span> {formData.pricing.basePrice} Ksh per {pricingUnits.find(u => u.value === formData.pricing.unit)?.label}</p>
          {formData.pricing.additionalFee && (
            <p><span className="font-semibold">Additional Fee:</span> <span className="break-words">{formData.pricing.additionalFee} Ksh ({formData.pricing.additionalFeeReason})</span></p>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: Vertical Progress */}
          <div className="sm:hidden">
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Step {currentStep} of {steps.length}
              </p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {steps.find(s => s.id === currentStep)?.title}
              </h2>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop: Horizontal Progress */}
          <div className="hidden sm:flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        isCompleted
                          ? "bg-green-600 text-white"
                          : isActive
                            ? "bg-green-100 text-green-600 border-2 border-green-600"
                            : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-xs font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}>
                        Step {step.id}
                      </p>
                      <p className={`text-xs ${isActive ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${isCompleted ? "bg-green-600" : "bg-gray-200"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
          {currentStep === 1 && renderBusinessInfo()}
          {currentStep === 2 && renderServiceDetails()}
          {currentStep === 3 && renderSubscription()}
          {currentStep === 4 && renderPricing()}
          {currentStep === 5 && renderDocuments()}
          {currentStep === 6 && renderReview()}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-6 sm:mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
            >
              Previous
            </button>

            <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
              {currentStep === 5 ? (
                <>
                  <button 
                    onClick={() => setCurrentStep(6)} 
                    className="btn-secondary"
                  >
                    Skip Documents
                  </button>
                  <button onClick={() => setCurrentStep(6)} className="btn-primary">
                    Next
                  </button>
                </>
              ) : currentStep < 6 ? (
                <button onClick={() => setCurrentStep(Math.min(6, currentStep + 1))} className="btn-primary">
                  Next
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                  {loading ? <LoadingSpinner size="sm" /> : "Complete Setup"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollectorOnboarding