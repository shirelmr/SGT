import { talkLogo } from '../../assets';

export default function AuthLayout({ children, scrollable = false }) {
  return (
    <div
      className={`flex justify-between px-12 gap-8 ${scrollable ? 'h-screen overflow-hidden' : 'min-h-screen items-center py-10'}`}
      style={{ backgroundColor: '#f8f8ec' }}
    >
      {/* Left panel — always vertically centered */}
      <div className="hidden md:flex flex-col items-center justify-center flex-1 gap-12 text-center h-full">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-3">
          <img src={talkLogo} alt="Talk! logo" className="w-56 h-auto drop-shadow-sm" />
          <p className="text-4xl font-extrabold tracking-tight" style={{ color: '#4a1f06', fontFamily: 'Sora, sans-serif' }}>
            TALK!
          </p>
        </div>

        {/* Copy / Message Section */}
        <div className="flex flex-col gap-5 items-center max-w-sm">
          {/* Modern Badge */}
          <span 
            className="px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full" 
            style={{ backgroundColor: 'rgba(238, 126, 76, 0.15)', color: '#ee7e4c' }}
          >
            Proyecto Solidario · Tec Campus Puebla
          </span>
          
          {/* Straightforward Headline */}
          <h1
            className="text-3xl font-bold leading-snug"
            style={{ color: '#4a1f06', fontFamily: 'Sora, sans-serif' }}
          >
            Sistema de gestión <br/> <span style={{ color: '#ee7e4c' }}>de clases de inglés</span>
          </h1>
          
          {/* Clean Subtitle */}
          <p className="text-base font-medium" style={{ color: 'rgba(74, 31, 6, 0.6)' }}>
            Impulsando el aprendizaje a través del acompañamiento voluntario.
          </p>
        </div>
        
      </div>

      {/* Right panel — scrolls internally when needed */}
      <div className={`flex flex-col items-center flex-1 ${scrollable ? 'h-full overflow-y-auto py-10' : 'justify-center'}`}>
        <img src={talkLogo} alt="Talk! logo" className="h-16 w-auto mb-8 md:hidden" />
        {children}
      </div>
    </div>
  );
}