import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Shell from './layouts/Shell';
import Home from './pages/Home';
import Status from './pages/Status';
import Identify from './pages/Identify';
import Care from './pages/Care';
import Growth from './pages/Growth';
import MyChild from './pages/MyChild';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/status" element={<Status />} />
          <Route path="/identify" element={<Identify />} />
          <Route path="/mychild" element={<MyChild />} />
          <Route path="/care/:id" element={<Care />} />
          <Route path="/growth/:id" element={<Growth />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;

