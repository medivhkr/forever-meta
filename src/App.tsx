import { Route, Routes } from 'react-router';
import Layout from './components/Layout.tsx';
import TierPage from './pages/TierPage.tsx';
import BossPage from './pages/BossPage.tsx';
import SpecPage from './pages/SpecPage.tsx';
import ForeverPage from './pages/ForeverPage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import NotFound from './pages/NotFound.tsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TierPage />} />
        <Route path="raid/:zoneId" element={<TierPage />} />
        <Route path="raid/:zoneId/boss/:encounterId" element={<BossPage />} />
        <Route path="spec/:cls/:spec" element={<SpecPage />} />
        <Route path="forever" element={<ForeverPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
