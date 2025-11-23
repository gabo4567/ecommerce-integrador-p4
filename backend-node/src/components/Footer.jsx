export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] border-t border-gray-800 text-gray-300 px-6 py-6 text-sm mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div>
          <p className="text-white text-base">E-Commerce</p>
          <p className="text-gray-400">Tecnología y electrónica de vanguardia</p>
        </div>
        <div className="grid gap-2">
          <a className="footer-link" href="#">Contacto</a>
          <a className="footer-link" href="#">Soporte</a>
          <a className="footer-link" href="#">Privacidad</a>
        </div>
        <div className="grid gap-2">
          <a className="footer-link" href="#">Instagram</a>
          <a className="footer-link" href="#">Twitter/X</a>
          <a className="footer-link" href="#">LinkedIn</a>
        </div>
      </div>
    </footer>
  )
}
