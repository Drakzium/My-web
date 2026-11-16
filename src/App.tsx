import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from './layouts/PublicLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { HomePage } from './pages/public/Home'
import { AboutPage } from './pages/public/About'
import { ProjectsPage } from './pages/public/Projects'
import { ProjectDetailPage } from './pages/public/ProjectDetail'
import { SkillsPage } from './pages/public/Skills'
import { ServicesPage } from './pages/public/Services'
import { ExperiencePage } from './pages/public/Experience'
import { ContactPage } from './pages/public/Contact'
import { AdminLoginPage } from './pages/admin/Login'
import { AdminOverviewPage } from './pages/admin/Overview'
import { AdminProjectsPage } from './pages/admin/Projects'
import { AdminProjectEditorPage } from './pages/admin/ProjectEditor'
import { AdminMediaPage } from './pages/admin/Media'
import { AdminContentPage } from './pages/admin/Content'
import { AdminSettingsPage } from './pages/admin/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:slug" element={<ProjectDetailPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="experience" element={<ExperiencePage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="projects/:id" element={<AdminProjectEditorPage />} />
          <Route path="media" element={<AdminMediaPage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
