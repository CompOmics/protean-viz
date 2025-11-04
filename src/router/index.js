import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import VizComponent from '@/components/VizComponent.vue'
import SageComponent from '@/components/SageComponent.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/custom-results',
      name: 'custom',
      component: VizComponent
    },
    {
      path: '/sage-results',
      name: 'sage',
      component: SageComponent
    }
  ],
})

export default router
