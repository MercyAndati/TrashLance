import { useRef, useEffect, useState } from "react"
import { Users, Truck, Star, AlertTriangle, Calendar, DollarSign, CheckCircle, ArrowDownCircle, Crown, TrendingUp, CreditCard, Check } from "lucide-react"
import api from "../services/api"

const InfoPage = () => {
  const userRef = useRef(null)
  const collectorRef = useRef(null)
  const howItWorksRef = useRef(null)
  const pricingRef = useRef(null)

  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState("")

  const scrollTo = (ref) => {
    if (ref.current) ref.current.scrollIntoView({ behavior: "smooth" })
  }

  // Fetch plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true)
        setPlansError("")
        const res = await api.get("/subscriptions/plans")
        setPlans(res.data.data)
      } catch (err) {
        setPlansError("Failed to load pricing. Please try again later.")
      } finally {
        setPlansLoading(false)
      }
    }
    fetchPlans()
  }, [])

  // Scroll to section if hash is present
  useEffect(() => {
    const hash = window.location.hash
    if (hash === "#users") scrollTo(userRef)
    else if (hash === "#collectors") scrollTo(collectorRef)
    else if (hash === "#how-it-works") scrollTo(howItWorksRef)
    else if (hash === "#pricing") scrollTo(pricingRef)
  }, [])

  const getPlanIcon = (planName) => {
    switch (planName) {
      case "Premium":
        return <Crown className="w-6 h-6 text-yellow-500" />
      case "Standard":
        return <TrendingUp className="w-6 h-6 text-blue-500" />
      default:
        return <CreditCard className="w-6 h-6 text-gray-500" />
    }
  }

  const getPlanColor = (planName) => {
    switch (planName) {
      case "Premium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
      case "Standard":
        return "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
      default:
        return "border-gray-300 bg-gray-50 dark:bg-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Anchor Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button onClick={() => scrollTo(userRef)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">For Users</button>
          <button onClick={() => scrollTo(collectorRef)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">For Collectors</button>
          <button onClick={() => scrollTo(howItWorksRef)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">How It Works</button>
          <button onClick={() => scrollTo(pricingRef)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors">Pricing</button>
        </div>

        {/* For Users Section */}
        <section ref={userRef} className="mb-12">
          <div className="flex items-center mb-4">
            <Users className="w-7 h-7 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">For Users</h2>
          </div>
          <ul className="list-disc ml-8 text-gray-700 dark:text-gray-300 space-y-2">
            <li>Sign up and log in as a user</li>
            <li>Report illegal dumping with photos and location pins</li>
            <li>Request waste pickups from nearby certified collectors</li>
            <li>Choose flexible collection schedules and pricing</li>
            <li>Track your booking and payment status in real time</li>
            <li>Earn points for reports and successful pickups</li>
            <li>Climb the community leaderboard</li>
            <li>Receive email and SMS notifications</li>
          </ul>
        </section>

        {/* For Collectors Section */}
        <section ref={collectorRef} className="mb-12">
          <div className="flex items-center mb-4">
            <Truck className="w-7 h-7 text-green-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">For Collectors</h2>
          </div>
          <ul className="list-disc ml-8 text-gray-700 dark:text-gray-300 space-y-2">
            <li>Register as a certified waste collector</li>
            <li>Set up your profile and service types (General, Recyclables, E-Waste, Organic)</li>
            <li>Set flexible pricing for weekly, monthly, or zone-based pickups</li>
            <li>Receive and manage pickup requests relevant to your services</li>
            <li>Update booking and payment status for each job</li>
            <li>Track your performance and earnings with analytics</li>
            <li>Communicate with users via email and SMS</li>
            <li>Upgrade to premium for more features and visibility</li>
          </ul>
        </section>

        {/* How It Works Section */}
        <section ref={howItWorksRef} className="mb-12">
          <div className="flex items-center mb-4">
            <Star className="w-7 h-7 text-purple-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User Steps */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center"><Users className="w-5 h-5 mr-2" />For Users</h3>
              <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Sign up and log in to your account</li>
                <li>Report waste or request a pickup</li>
                <li>Select a collector and schedule a pickup</li>
                <li>Track your booking and payment status</li>
                <li>Chat with your service provider in-app for updates or clarifications</li>
                <li>Earn points and climb the leaderboard</li>
                <li>Receive notifications and updates</li>
              </ol>
            </div>
            {/* Collector Steps */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center"><Truck className="w-5 h-5 mr-2" />For Collectors</h3>
              <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Register and set up your collector profile</li>
                <li>Set your service types and pricing</li>
                <li>Receive and accept pickup requests</li>
                <li>Complete pickups and update payment status</li>
                <li>Message customers directly in-app for coordination and support</li>
                <li>Track your earnings and performance</li>
                <li>Upgrade to premium for more features</li>
              </ol>
            </div>
          </div>

          {/* Posts/Reports Card */}
          <div className="mt-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center md:space-x-6">
              <AlertTriangle className="w-10 h-10 text-red-600 mb-4 md:mb-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">Posts & Community Reports</h3>
                <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Report illegal dumping or environmental hazards with photos and location details.</li>
                  <li>Your report is visible to the public and government for transparency and action.</li>
                  <li>Government teams monitor, update progress, and mark cleanups as in progress or completed.</li>
                  <li>Receive notifications when your report is being addressed or resolved.</li>
                  <li>Help keep your community clean and informed!</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section ref={pricingRef} className="mb-12">
          <div className="flex items-center mb-4">
            <DollarSign className="w-7 h-7 text-yellow-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pricing</h2>
          </div>
          {plansLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-300">Loading pricing...</span>
            </div>
          ) : plansError ? (
            <div className="text-red-600 text-center py-8">{plansError}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div key={plan.name} className={`border-2 rounded-lg p-6 ${getPlanColor(plan.name)} flex flex-col`}>
                  <div className="flex items-center space-x-3 mb-4">
                    {getPlanIcon(plan.name)}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name} Plan</h3>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {plan.price === 0 ? 'Free' : `KSh ${plan.price.toLocaleString()}`}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">per month</div>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Back to Top */}
        <div className="flex justify-center mt-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <ArrowDownCircle className="w-5 h-5 mr-2 rotate-180" /> Back to Top
          </button>
        </div>
      </div>
    </div>
  )
}

export default InfoPage 