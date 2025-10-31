import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from './components/ScrollToTop';
import Shell from './layouts/Shell';
import Home from './pages/Home';
import Status from './pages/Status';
import Identify from './pages/Identify';
import CareDetail from './pages/Care';
import CareList from './pages/CareList';
import GrowthDetail from './pages/Growth';
import GrowthStandalone from './pages/GrowthStandalone';
import MyChild from './pages/MyChild';
import ProgramGuide from './pages/ProgramGuide';
import PlantDetect from './pages/PlantDetect';

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                <Route element={<Shell />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/guide" element={<ProgramGuide />} />
                    <Route path="/status" element={<Status />} />
                    <Route path="/identify" element={<Identify />} />
                    <Route path="/care" element={<CareList />} />
                    <Route path="/care/:id" element={<CareDetail />} />
                    <Route path="/growth" element={<GrowthStandalone />} />
                    <Route path="/growth/:id" element={<GrowthDetail />} />
                    <Route path="/predict/:id" element={<GrowthDetail />} />
                    <Route path="/mychild" element={<MyChild />} />

                    {/* 병해충 진단 라우트 (백엔드 연동) */}
                    <Route path="/pest" element={<PlantDetect />} />
                    <Route path="/detect" element={<PlantDetect />} />
                </Route>
            </Routes>
            <Toaster />
        </BrowserRouter>
    );
}

export default App;
