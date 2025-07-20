import { useRef } from "react"
import { Mail, Info, HelpCircle, Users, Truck, Star } from "lucide-react"

const HelpCenterPage = () => {
  const faqRef = useRef(null)
  const guidesRef = useRef(null)
  const contactRef = useRef(null)
  const aboutRef = useRef(null)

  const scrollTo = (ref) => {
    if (ref.current) ref.current.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Anchor Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button onClick={() => scrollTo(faqRef)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">FAQs</button>
          <button onClick={() => scrollTo(guidesRef)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">Guides</button>
          <button onClick={() => scrollTo(contactRef)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">Contact Us</button>
          <button onClick={() => scrollTo(aboutRef)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">About Us</button>
        </div>

        {/* FAQs Section */}
        <section ref={faqRef} className="mb-12">
          <div className="flex items-center mb-4">
            <HelpCircle className="w-7 h-7 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">How do I request a waste pickup?</h3>
              <p className="text-gray-700 dark:text-gray-300">Sign up or log in as a user, then use the dashboard to request a pickup from nearby certified collectors. You can select your preferred schedule and pricing.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">How do I become a certified collector?</h3>
              <p className="text-gray-700 dark:text-gray-300">Register as a collector, set up your profile and service types, and start receiving pickup requests. Upgrade to premium for more features and visibility.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">How does the points and leaderboard system work?</h3>
              <p className="text-gray-700 dark:text-gray-300">You earn points for reporting waste, successful pickups, and community engagement. The leaderboard ranks the most active users in your community.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">How do I contact support?</h3>
              <p className="text-gray-700 dark:text-gray-300">You can email us at <a href="mailto:andatishine@gmail.com" className="text-blue-600 underline">andatishine@gmail.com</a> or use the Contact Us section below.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Is my data secure?</h3>
              <p className="text-gray-700 dark:text-gray-300">Yes, we use secure authentication and encrypted storage for your data. We never share your information without your consent.</p>
            </div>
          </div>
        </section>

        {/* Guides Section */}
        <section ref={guidesRef} className="mb-12">
          <div className="flex items-center mb-4">
            <Info className="w-7 h-7 text-green-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Guides</h2>
          </div>
          <ul className="list-disc ml-8 text-gray-700 dark:text-gray-300 space-y-2">
            <li><a href="/info#users" className="text-blue-600 underline">How to use TrashLance as a User</a></li>
            <li><a href="/info#collectors" className="text-green-600 underline">How to use TrashLance as a Collector</a></li>
            <li><a href="/info#how-it-works" className="text-purple-600 underline">How It Works: Step-by-Step</a></li>
            <li>Need more help? Email <a href="mailto:andatishine@gmail.com" className="text-blue-600 underline">andatishine@gmail.com</a></li>
          </ul>
        </section>

        {/* Contact Us Section */}
        <section ref={contactRef} className="mb-12">
          <div className="flex items-center mb-4">
            <Mail className="w-7 h-7 text-purple-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Us</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 mb-2">For support, feedback, or partnership inquiries, email:</p>
            <a href="mailto:andatishine@gmail.com" className="text-blue-600 underline text-lg font-semibold">andatishine@gmail.com</a>
          </div>
        </section>

        {/* About Us Section */}
        <section ref={aboutRef} className="mb-12">
          <div className="flex items-center mb-4">
            <Users className="w-7 h-7 text-gray-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">About Us</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <span className="font-semibold">Mission:</span> TrashLance was created to empower Kenyan communities to manage waste more efficiently, connect directly with certified collectors, and support government cleanup efforts—all while making the process rewarding and transparent.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <span className="font-semibold">About the Creator:</span> Built by Mercy Andati, a fullstack software engineer based in Kenya. <a href="https://github.com/MercyAndati" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">GitHub</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default HelpCenterPage 