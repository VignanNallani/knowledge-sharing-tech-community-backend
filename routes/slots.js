import express from 'express'
import { createSlot, listSlots, bookSlot } from '../controllers/slotController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// mentors create slots
router.post('/', authenticateToken, createSlot)

// list open slots, optional mentorId
router.get('/', listSlots)

// mentee books slot
router.post('/book', authenticateToken, bookSlot)

export default router
