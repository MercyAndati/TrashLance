import { Link } from "react-router-dom"
import { Search, AlertTriangle, Recycle, BarChart3, ArrowRight, CheckCircle, Users, MapPin, Clock } from "lucide-react"

const LandingPage = () => {
  const features = [
    {
      icon: <Search className="w-8 h-8 text-green-600" />,
      title: "Search & Book a Trash Collector",
      description: "Find verified waste collectors in your area and book services instantly",
      image: "/TrashLance.png?height=200&width=300",
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
      title: "Report Illegal Dumpsites",
      description: "Help keep your community clean by reporting illegal dumping to authorities",
      image: "/TrashLance.png?height=200&width=300",
    },
    {
      icon: <Recycle className="w-8 h-8 text-blue-600" />,
      title: "Connect for Recycled Items",
      description: "Connect with clients who need recycled materials collection services",
      image: "/TrashLance.png?height=200&width=300",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
      title: "Track Your Environmental Impact",
      description: "Monitor your bookings and see your positive environmental contribution",
      image: "/TrashLance.png?height=200&width=300",
    },
  ]

  const stats = [
    { number: "10,000+", label: "Happy Customers", icon: <Users className="w-6 h-6" /> },
    { number: "500+", label: "Verified Collectors", icon: <CheckCircle className="w-6 h-6" /> },
    { number: "50+", label: "Cities Covered", icon: <MapPin className="w-6 h-6" /> },
    { number: "24/7", label: "Support Available", icon: <Clock className="w-6 h-6" /> },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  Welcome to <span className="text-green-600 dark:text-green-400">Trashlance</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Connecting communities with reliable waste management services. Book collectors, report issues, and
                  make a positive environmental impact.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors group"
                >
                  Login
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 font-semibold rounded-lg border-2 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Sign Up as User
                </Link>
                <Link
                  to="/register/collector"
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Sign Up as Collector
                </Link>
              </div>
            </div>

            <div className="relative">
              <img
                src="/TrashLance.png?height=500&width=600"
                alt="Waste Management"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Verified Collectors</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Trusted & Reliable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.number}</div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Waste Management
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our platform provides comprehensive solutions for both waste generators and collectors
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
                    <img
                      src={feature.image || "/TrashLance.png"}
                      alt={feature.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 dark:bg-green-700">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of users who are already making their communities cleaner and greener
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get Started Today
            </Link>
            <Link
              to="/register/collector"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-green-600 transition-colors"
            >
              Become a Collector
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
