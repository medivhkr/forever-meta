import { Route, Routes } from 'react-router';
import Layout from './components/Layout.tsx';
import TierPage from './pages/TierPage.tsx';
import BossPage from './pages/BossPage.tsx';
import SpecPage from './pages/SpecPage.tsx';
import CharactersPage from './pages/CharactersPage.tsx';
import CharacterPage from './pages/CharacterPage.tsx';
import ItemsPage from './pages/ItemsPage.tsx';
import ItemPage from './pages/ItemPage.tsx';
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
        <Route path="characters" element={<CharactersPage />} />
        <Route path="character/:id" element={<CharacterPage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="item/:id" element={<ItemPage />} />
        <Route path="forever" element={<ForeverPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
