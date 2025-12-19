import { createRouter, createWebHistory } from 'vue-router'
import { checkIsAdmin } from '@/api/axios'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/LandingView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/AuthView.vue'),
    },
    {
      path: '/campaigns',
      name: 'campaigns',
      component: () => import('../views/CampaignView.vue'),
    },
    {
      path: '/campaigns/:id',
      name: 'campaign-detail',
      component: () => import('../views/CampaignDetailView.vue'),
    },
    {
      path: '/campaign/create',
      name: 'campaign-create',
      component: () => import('../views/CampaignCreateView.vue'),
      beforeEnter: (to, from, next) => {
        const token = localStorage.getItem('Authorization')
        if (checkIsAdmin(token)) {
          next()
        } else {
          alert('ACCESS DENIED: ADMIN CLEARANCE REQUIRED')
          next('/')
        }
      }
    },
  ],
})

export default router
