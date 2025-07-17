"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, AlertTriangle, Upload, X } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import LoadingSpinner from "../components/common/LoadingSpinner"

const CreatePost = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium",
    location: {
      placeName: "",
      coordinates: {
        latitude: "",
        longitude: "",
      },
    },
  })
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [locationLoading, setLocationLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleLocationChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: {
          ...prev.location.coordinates,
          [name]: value,
        },
      },
    }))
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.")
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: {
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
            },
          },
        }))
        setLocationLoading(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        alert("Unable to get your location. Please enter coordinates manually.")
        setLocationLoading(false)
      },
    )
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 5) {
      alert("You can upload a maximum of 5 images.")
      return
    }

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert("Each image must be less than 10MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setImages((prev) => [
          ...prev,
          {
            file,
            preview: e.target.result,
            id: Date.now() + Math.random(),
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.location.placeName.trim()) {
      newErrors.placeName = "Location name is required"
    }

    if (!formData.location.coordinates.latitude || !formData.location.coordinates.longitude) {
      newErrors.coordinates = "Coordinates are required"
    }

    if (images.length === 0) {
      newErrors.images = "At least one image is required as evidence"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const submitData = new FormData()
      submitData.append("title", formData.title)
      submitData.append("description", formData.description)
      submitData.append("severity", formData.severity)
      submitData.append("location", JSON.stringify(formData.location))

      images.forEach((image) => {
        submitData.append("images", image.file)
      })

      const response = await api.post("/posts", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      navigate(`/posts/${response.data.data._id}`)
    } catch (error) {
      console.error("Failed to create post:", error)
      alert("Failed to submit report. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Illegal Dumping</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Help keep your community clean by reporting illegal waste dumping sites
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input-field ${errors.title ? "border-red-500" : ""}`}
                placeholder="Brief description of the issue"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Detailed Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className={`input-field resize-none ${errors.description ? "border-red-500" : ""}`}
                placeholder="Provide detailed information about the illegal dumping site, including types of waste, estimated quantity, and any other relevant details"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Severity */}
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity Level
              </label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="input-field"
              >
                <option value="low">Low - Minor litter or small items</option>
                <option value="medium">Medium - Moderate amount of waste</option>
                <option value="high">High - Large amount of waste or hazardous materials</option>
                <option value="critical">Critical - Environmental hazard or blocking access</option>
              </select>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <div>
                <label htmlFor="placeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="placeName"
                    name="location.placeName"
                    value={formData.location.placeName}
                    onChange={handleChange}
                    className={`input-field ${errors.placeName ? "border-red-500" : ""}`}
                    placeholder="e.g., Behind Main Street Mall, Near Oak Park"
                  />
                </div>
                {errors.placeName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.placeName}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    id="latitude"
                    name="latitude"
                    value={formData.location.coordinates.latitude}
                    onChange={handleLocationChange}
                    className={`input-field ${errors.coordinates ? "border-red-500" : ""}`}
                    placeholder="e.g., 40.7128"
                  />
                </div>
                <div>
                  <label
                    htmlFor="longitude"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    id="longitude"
                    name="longitude"
                    value={formData.location.coordinates.longitude}
                    onChange={handleLocationChange}
                    className={`input-field ${errors.coordinates ? "border-red-500" : ""}`}
                    placeholder="e.g., -74.0060"
                  />
                </div>
              </div>

              {errors.coordinates && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.coordinates}</p>
              )}

              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {locationLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Use Current Location
                  </>
                )}
              </button>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evidence Photos * (Max 5 images, 10MB each)
              </label>

              <div className="space-y-4">
                {/* Upload Button */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> evidence photos
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or JPEG (MAX. 10MB each)</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={images.length >= 5}
                    />
                  </label>
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.preview || "/placeholder.svg"}
                          alt="Evidence"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {errors.images && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.images}</p>}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Important Notice</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Please ensure all information is accurate. False reports may result in account suspension. Do not
                    approach or disturb the dumping site - take photos from a safe distance.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <LoadingSpinner size="sm" /> : "Submit Report"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreatePost
