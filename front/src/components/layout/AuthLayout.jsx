import { talkLogo } from '../../assets';

export default function AuthLayout({ children, scrollable = false }) {
  return (
    <div
      className={`flex justify-between px-12 gap-8 ${scrollable ? 'h-screen overflow-hidden' : 'min-h-screen items-center py-10'}`}
      style={{ backgroundColor: '#f8f8ec' }}
    >
      {/* Left panel — always vertically centered */}
      <div className="hidden md:flex flex-col items-center justify-center flex-1 gap-8 text-center h-full">
        <div className="flex flex-col items-center gap-2">
          <img src={talkLogo} alt="Talk! logo" className="w-64 h-auto" />
          <p className="text-3xl font-bold" style={{ color: '#4a1f06', fontFamily: 'Sora, sans-serif' }}>TALK!</p>
        </div>
        <div className="flex flex-col gap-4 items-center">
          <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#ee7e4c' }}>
            Proyecto Solidario · Tec Campus Puebla
          </p>
          <h1
            className="text-2xl font-bold leading-tight w-72"
            style={{ color: '#4a1f06', fontFamily: 'Sora, sans-serif' }}
          >
            Clases de inglés para secundarias técnicas
          </h1>
          <p className="text-lg font-medium" style={{ color: '#ee7e4c' }}>
            Educación que transforma.
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
