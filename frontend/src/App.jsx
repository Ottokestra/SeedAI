import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from './components/ScrollToTop';
import Shell from './layouts/Shell';
import Home from './pages/Home';
import Status from './pages/Status';
import Identify from './pages/Identify';
import Care from './pages/Care';
import CareChat from './pages/CareChat';
import Growth from './pages/Growth';
import GrowthStandalone from './pages/GrowthStandalone';
import MyChild from './pages/MyChild';
import ProgramGuide from './pages/ProgramGuide';
import PlantDetect from './pages/PlantDetect';

function App() {
    return (
        <BrowserRouter
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            <ScrollToTop />
            <Routes>
                <Route element={<Shell />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/guide" element={<ProgramGuide />} />
                    <Route path="/status" element={<Status />} />
                    <Route path="/identify" element={<Identify />} />
                    <Route path="/care" element={<CareChat />} />
                    <Route path="/care/:id" element={<Care />} />
                    <Route path="/growth" element={<GrowthStandalone />} />
                    <Route path="/growth/:id" element={<Growth />} />
                    <Route path="/mychild" element={<MyChild />} />
                    <Route path="/detect" element={<PlantDetect />} />
                </Route>
            </Routes>
            <Toaster />
        </BrowserRouter>
    );
}

export default App;
