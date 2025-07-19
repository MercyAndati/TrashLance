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
      type: "per_service",
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
    { id: 1, title: "Business Information", icon: FileText },
    { id: 2, title: "Service Details", icon: MapPin },
    { id: 3, title: "Subscription", icon: Star },
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
          className="input-field"
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
          className="input-field"
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
          className="input-field"
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
          className="input-field"
          placeholder="e.g., Ruai, Kamulu, Stage 26"
          required
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enter all areas you serve, separated by commas.</p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Working Hours</h3>
        <div className="space-y-3">
          {Object.keys(formData.workingHours).map((day) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-24">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.workingHours[day].available}
                    onChange={(e) => handleWorkingHoursChange(day, "available", e.target.checked)}
                    className="mr-2"
                  />
                  <span className="capitalize font-medium text-gray-900 dark:text-white">{day}</span>
                </label>
              </div>
              {formData.workingHours[day].available && (
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={formData.workingHours[day].start}
                    onChange={(e) => handleWorkingHoursChange(day, "start", e.target.value)}
                    className="input-field w-32"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={formData.workingHours[day].end}
                    onChange={(e) => handleWorkingHoursChange(day, "end", e.target.value)}
                    className="input-field w-32"
                  />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.servicesOffered.includes(service.id)}
                  onChange={() => handleServiceToggle(service.id)}
                  className="text-green-600"
                />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{service.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{service.description}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          className="input-field"
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
          className="input-field"
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
          className="input-field"
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
          className="input-field"
          placeholder="e.g., 100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for Additional Fee (optional)</label>
        <input
          type="text"
          value={formData.pricing.additionalFeeReason}
          onChange={(e) => setFormData((prev) => ({ ...prev, pricing: { ...prev.pricing, additionalFeeReason: e.target.value } }))}
          className="input-field"
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
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
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
              <label htmlFor="business-license" className="btn-secondary cursor-pointer">
                Choose File
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Insurance Certificate
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {formData.documents.insurance ? formData.documents.insurance.name : "Upload insurance certificate"}
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload("insurance", e.target.files[0])}
                className="hidden"
                id="insurance"
              />
              <label htmlFor="insurance" className="btn-secondary cursor-pointer">
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
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p><span className="font-semibold">Business Name:</span> {formData.companyName}</p>
        <p><span className="font-semibold">Business License:</span> {formData.businessLicense}</p>
        <p><span className="font-semibold">Service Radius:</span> {formData.serviceRadius} km</p>
        <p><span className="font-semibold">Service Locations:</span> {formData.serviceLocations}</p>
        <p><span className="font-semibold">Working Hours:</span></p>
        <ul className="ml-6 list-disc">
          {Object.entries(formData.workingHours).map(([day, hours]) => (
            <li key={day}>
              {day.charAt(0).toUpperCase() + day.slice(1)}: {hours.available ? `${hours.start} - ${hours.end}` : "Not available"}
            </li>
          ))}
        </ul>
        <p><span className="font-semibold">Services Offered:</span> {formData.servicesOffered.join(", ")}</p>
        <p><span className="font-semibold">Subscription Plan:</span> {subscriptionPlans.find(p => p.id === formData.subscription)?.name}</p>
        <p><span className="font-semibold">Pricing:</span> {formData.pricing.basePrice} Ksh per {pricingUnits.find(u => u.value === formData.pricing.unit)?.label}</p>
        {formData.pricing.additionalFee && (
          <p><span className="font-semibold">Additional Fee:</span> {formData.pricing.additionalFee} Ksh ({formData.pricing.additionalFeeReason})</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex items-center">
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
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}>
                      Step {step.id}
                    </p>
                    <p className={`text-sm ${isActive ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? "bg-green-600" : "bg-gray-200"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
          {currentStep === 1 && renderBusinessInfo()}
          {currentStep === 2 && renderServiceDetails()}
          {currentStep === 3 && renderSubscription()}
          {currentStep === 4 && renderPricing()}
          {currentStep === 5 && renderDocuments()}
          {currentStep === 6 && renderReview()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep === 5 ? (
              <div className="flex space-x-3">
                <button 
                  onClick={() => setCurrentStep(6)} 
                  className="btn-secondary"
                >
                  Skip Documents
                </button>
                <button onClick={() => setCurrentStep(6)} className="btn-primary">
                  Next
                </button>
              </div>
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
  )
}

export default CollectorOnboarding
