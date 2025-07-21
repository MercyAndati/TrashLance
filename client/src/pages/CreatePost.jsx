"use client"

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, AlertTriangle, Upload, X, ArrowLeft, Camera } from "lucide-react"
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
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locationSearchLoading, setLocationSearchLoading] = useState(false)
  const [locationSearchError, setLocationSearchError] = useState("")
  const locationInputRef = useRef(null)
  const locationSearchTimeout = useRef(null)
  const fileInputRef = useRef(null)

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

      navigate(`/posts/${response.data.data.post._id}`)
    } catch (error) {
      console.error("Failed to create post:", error)
      alert("Failed to submit report. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Location search handler with debounce
  const handleLocationSearch = (e) => {
    const value = e.target.value
    handleChange(e)
    setLocationSearchError("")
    if (locationSearchTimeout.current) {
      clearTimeout(locationSearchTimeout.current)
    }
    if (value.length < 3) {
      setLocationSuggestions([])
      setShowSuggestions(false)
      return
    }
    setLocationSearchLoading(true)
    locationSearchTimeout.current = setTimeout(async () => {
      try {
        const response = await api.get(`/location/search?query=${encodeURIComponent(value)}`)
        setLocationSuggestions(response.data.data)
        setShowSuggestions(true)
        // If only suggestion is Nairobi default, show error
        if (
          response.data.data.length === 1 &&
          response.data.data[0].name === "Nairobi, Kenya (default)"
        ) {
          setLocationSearchError("No results found. Using Nairobi as default.")
        }
      } catch (error) {
        setLocationSuggestions([])
        setShowSuggestions(false)
        setLocationSearchError("Location search failed. Please try again.")
      } finally {
        setLocationSearchLoading(false)
      }
    }, 400) // 400ms debounce
  }

  // When user selects a suggestion
  const handleSuggestionSelect = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        placeName: suggestion.name,
        coordinates: {
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
        },
      },
    }))
    setLocationSuggestions([])
    setShowSuggestions(false)
    setLocationSearchError("")
    if (locationInputRef.current) locationInputRef.current.blur()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="sm:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Report Dumping</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Help keep your community clean</p>
          </div>
        </div>
      </div>

      <div className="py-4 sm:py-8">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            {/* Desktop Header */}
            <div className="hidden sm:block mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Illegal Dumping</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Help keep your community clean by reporting illegal waste dumping sites
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${errors.title ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
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
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base ${errors.description ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
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
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="low">Low - Minor litter or small items</option>
                  <option value="medium">Medium - Moderate amount of waste</option>
                  <option value="high">High - Large amount of waste or hazardous materials</option>
                  <option value="critical">Critical - Environmental hazard or blocking access</option>
                </select>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="relative">
                  <label htmlFor="placeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 h-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="placeName"
                      name="location.placeName"
                      value={formData.location.placeName}
                      onChange={handleLocationSearch}
                      ref={locationInputRef}
                      autoComplete="off"
                      className={`w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${errors.placeName ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                      placeholder="e.g., Behind Main Street Mall, Near Oak Park"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Tip: Search for a general area (e.g., city, town, or neighborhood). Add specific details in the description below.
                    </p>
                    {/* Suggestions dropdown */}
                    {showSuggestions && (
                      <ul className="absolute z-10 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mt-1 max-h-56 overflow-y-auto shadow-lg">
                        {locationSuggestions.length === 1 && locationSuggestions[0].name === "Nairobi, Kenya (default)" ? (
                          <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 cursor-default">
                            No results found. Using Nairobi as default.
                          </li>
                        ) : (
                          locationSuggestions.map((suggestion, idx) => (
                            <li
                              key={idx}
                              className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                              onClick={() => handleSuggestionSelect(suggestion)}
                            >
                              {suggestion.name}
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                    {locationSearchLoading && (
                      <div className="absolute right-3 top-2 sm:top-3 text-gray-400 text-xs">Searching...</div>
                    )}
                  </div>
                  {locationSearchError && (
                    <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">{locationSearchError}</p>
                  )}
                  {errors.placeName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.placeName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${errors.coordinates ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
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
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base ${errors.coordinates ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
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
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base"
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
                    <label className="flex flex-col items-center justify-center w-full h-24 sm:h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                      <div className="flex flex-col items-center justify-center pt-3 pb-3 sm:pt-5 sm:pb-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <Camera className="w-5 h-5 sm:w-8 sm:h-8 text-gray-500 dark:text-gray-400" />
                          <Upload className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" />
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center px-2">
                          <span className="font-semibold">Tap to upload</span> evidence photos
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">PNG, JPG or JPEG (MAX. 10MB each)</p>
                      </div>
                      <input
                        ref={fileInputRef}
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative">
                          <img
                            src={image.preview || "/TrashLance.png"}
                            alt="Evidence"
                            className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-lg"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.images && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.images}</p>}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Important Notice</h3>
                    <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      Please ensure all information is accurate. False reports may result in account suspension. Do not
                      approach or disturb the dumping site - take photos from a safe distance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex justify-center py-3 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <LoadingSpinner size="sm" /> : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="sm:flex-none px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePost