import { Link, NavLink, Outlet } from 'react-router-dom';

export default function Shell() {
  return (
    <div className="min-h-screen bg-emerald-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-emerald-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between p-3">
          {/* 로고 + 슬로건 - 클릭 시 홈으로 */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            {/* 새싹 아이 로고 이미지 */}
            <img 
              src="/images/logo.svg" 
              alt="새싹 아이 로고" 
              className="w-12 h-12 object-contain"
            />
            <div className="leading-tight">
              <div className="font-semibold text-lg text-gray-800" style={{ letterSpacing: '0.02em' }}>새싹 아이</div>
              <div className="text-[10px] tracking-[0.25em] text-gray-500 font-light">PLANT-AI</div>
            </div>
          </Link>
          
          {/* 네비게이션 메뉴 */}
          <nav className="flex gap-4 text-sm font-medium">
            <NavLink 
              to="/guide" 
              className={({ isActive }) => 
                `hover:text-emerald-700 transition ${isActive ? 'text-emerald-700 font-semibold' : 'text-emerald-900'}`
              }
            >
              새싹아이란?
            </NavLink>
            <NavLink 
              to="/identify" 
              className={({ isActive }) => 
                `hover:text-emerald-700 transition ${isActive ? 'text-emerald-700 font-semibold' : 'text-emerald-900'}`
              }
            >
              식별
            </NavLink>
            <NavLink 
              to="/care" 
              className={({ isActive }) => 
                `hover:text-emerald-700 transition ${isActive ? 'text-emerald-700 font-semibold' : 'text-emerald-900'}`
              }
            >
              관리법
            </NavLink>
            <NavLink 
              to="/growth" 
              className={({ isActive }) => 
                `hover:text-emerald-700 transition ${isActive ? 'text-emerald-700 font-semibold' : 'text-emerald-900'}`
              }
            >
              성장도
            </NavLink>
            <NavLink 
              to="/mychild" 
              className={({ isActive }) => 
                `hover:text-emerald-700 transition ${isActive ? 'text-emerald-700 font-semibold' : 'text-emerald-900'}`
              }
            >
              우리아이
            </NavLink>
            <NavLink 
              to="/detect" 
              className={({ isActive }) => 
                `hover:text-emerald-700 transition ${isActive ? 'text-emerald-700 font-semibold' : 'text-emerald-900'}`
              }
            >
              병충해 감지
            </NavLink>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

