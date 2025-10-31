import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from './components/ScrollToTop';
import Shell from './layouts/Shell';
import Home from './pages/Home';
import Status from './pages/Status';
import Identify from './pages/Identify';
import CareDetail from './pages/Care';
import CareChat from './pages/CareChat';
import GrowthDetail from './pages/Growth';
import GrowthStandalone from './pages/GrowthStandalone';
import MyChild from './pages/MyChild';
import ProgramGuide from './pages/ProgramGuide';

// 새로 추가
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
                    <Route path="/care" element={<CareChat />} />
                    <Route path="/care/:id" element={<CareDetail />} />
                    <Route path="/growth" element={<GrowthStandalone />} />
                    <Route path="/growth/:id" element={<GrowthDetail />} />
                    <Route path="/mychild" element={<MyChild />} />

                    {/* 식물 진단(기존 App 2) 라우트 */}
                    <Route path="/detect" element={<PlantDetect />} />
                </Route>
            </Routes>
            <Toaster />
        </BrowserRouter>
    );
}

export default App;
