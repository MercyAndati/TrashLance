"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle, Upload, MapPin, DollarSign, FileText } from "lucide-react"
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
    pricing: {
      baseRate: "",
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
    { id: 3, title: "Pricing", icon: DollarSign },
    { id: 4, title: "Documents", icon: Upload },
    { id: 5, title: "Review", icon: CheckCircle },
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
      const submitData = new FormData()

      // Add form data
      Object.keys(formData).forEach((key) => {
        if (key === "documents") {
          Object.keys(formData.documents).forEach((docKey) => {
            if (formData.documents[docKey]) {
              submitData.append(docKey, formData.documents[docKey])
            }
          })
        } else {
          submitData.append(key, JSON.stringify(formData[key]))
        }
      })

      const response = await api.post("/users/complete-onboarding", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      updateUser(response.data.data)
      navigate("/dashboard")
    } catch (error) {
      console.error("Failed to complete onboarding:", error)
      alert("Failed to complete onboarding. Please try again.")
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

  const renderPricing = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Base Rate (per service) *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.pricing.baseRate}
            onChange={(e) => handleInputChange("pricing", { ...formData.pricing, baseRate: e.target.value })}
            className="input-field pl-8"
            placeholder="0.00"
            required
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your standard rate for basic services</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Pricing Tips</h4>
        <ul className="text-blue-800 dark:text-blue-400 text-sm space-y-1">
          <li>• Research competitor pricing in your area</li>
          <li>• Consider your costs: fuel, equipment, time, disposal fees</li>
          <li>• You can adjust pricing later in your dashboard</li>
          <li>• Customers can see your rates before booking</li>
        </ul>
      </div>
    </div>
  )

  const renderDocuments = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Required Documents</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Upload the following documents to verify your business</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Business License *
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
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Review Your Information</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please review all information before submitting your application
        </p>

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Business Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Company Name:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{formData.companyName}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Service Radius:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{formData.serviceRadius} km</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Services Offered</h4>
            <div className="flex flex-wrap gap-2">
              {formData.servicesOffered.map((serviceId) => {
                const service = serviceTypes.find((s) => s.id === serviceId)
                return (
                  <span
                    key={serviceId}
                    className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-sm"
                  >
                    {service?.name}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Pricing</h4>
            <p className="text-gray-900 dark:text-white">Base Rate: ${formData.pricing.baseRate}</p>
          </div>
        </div>
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
          {currentStep === 3 && renderPricing()}
          {currentStep === 4 && renderDocuments()}
          {currentStep === 5 && renderReview()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < 5 ? (
              <button onClick={() => setCurrentStep(Math.min(5, currentStep + 1))} className="btn-primary">
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
