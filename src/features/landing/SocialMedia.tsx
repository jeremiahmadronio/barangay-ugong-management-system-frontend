import { motion } from 'framer-motion'

export const SocialMedia = () => {
  const socialWindows = [
    {
      name: 'Barangay\nFacebook',
      url: 'https://facebook.com/barangayugong',
      image: '/facebook-landing.png',
      delay: 0.1,
    },
    {
      name: 'Barangay\nInstagram',
      url: 'https://instagram.com/barangay_ugong',
      image: '/insta-landing.png',
      delay: 0.2,
    },
    {
      name: 'SK\nFacebook',
      url: 'https://facebook.com/skugong',
      image: '/sk-facebook.png',
      delay: 0.3,
    },
    {
      name: 'SK\nInstagram',
      url: 'https://instagram.com/skugong',
      image: '/sk-inta.png',
      delay: 0.4,
    },
  ]

  return (
    <section id="social" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mb-12">
          <p className="text-blue-600 font-semibold tracking-wide uppercase text-xs mb-2">
            Stay Connected
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-blue-950 text-center">
            Social Media Windows
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {socialWindows.map((item, index) => (
            <motion.a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: item.delay }}
              className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 w-full"
            >
              <img
                src={item.image}
                alt={item.name.replace('\n', ' ')}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

              <div className="absolute inset-0 flex items-center justify-center p-6">
                <h3 className="text-white text-xl sm:text-2xl font-bold text-center leading-tight drop-shadow-md whitespace-pre-line">
                  {item.name}
                </h3>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SocialMedia
