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
      path: '/campaigns/:campaignId/problems/:problemId/submit',
      name: 'problem-submission',
      component: () => import('../views/ProblemSubmissionView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/MyPageView.vue'),
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
    {
      path: '/campaigns/:campaignId/problems/:problemId/review',
      name: 'ReviewMatch',
      component: () => import('../views/ReviewMatchView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/submission/:id',
      name: 'submission-detail',
      component: () => import('../views/SubmissionDetailView.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

export default router
