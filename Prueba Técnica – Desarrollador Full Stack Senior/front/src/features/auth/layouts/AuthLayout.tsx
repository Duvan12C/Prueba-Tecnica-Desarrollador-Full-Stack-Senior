import { motion } from 'motion/react'
import { Outlet } from 'react-router'
import logo from '@/assets/docspace-imagotipo-horizontal-oscuro.svg'
import background from '@/assets/docspace-patron-oscuro.svg'

function AuthLayout() {
  return (
    <main className="grid min-h-dvh place-items-center bg-neutral-50 p-4 md:p-8">
      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-[0_25px_50px_-12px_rgba(11,28,48,0.2)] md:min-h-[34rem] md:grid-cols-[0.9fr_1.1fr]"
      >
        <aside
          className="relative flex min-h-80 flex-col justify-between bg-primary-900 bg-cover bg-center p-8 md:min-h-full md:p-10 lg:p-12"
          style={{ backgroundImage: `url("${background}")` }}
        >
          <img src={logo} alt="DocSpace" className="relative z-10 h-auto w-44 object-contain object-left" />

          <div className="relative z-10 mt-16 md:mt-0">
            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Documentos
              <br />
              en orden.
            </h1>
            <p className="mt-2 font-heading text-3xl font-bold leading-tight tracking-tight text-tertiary-300 md:text-4xl">
              Equipos en
              <br />
              sintonía.
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-primary-300">
              Gestiona, organiza y comparte tus documentos en un espacio de trabajo colaborativo.
            </p>
          </div>

          <p className="relative z-10 mt-12 text-xs text-primary-400">
            © {new Date().getFullYear()} DocSpace. Todos los derechos reservados.
          </p>
        </aside>

        <div className="flex min-h-[30rem] items-center justify-center p-8 md:min-h-0 md:p-12 lg:p-16">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </motion.section>
    </main>
  )
}

export default AuthLayout
