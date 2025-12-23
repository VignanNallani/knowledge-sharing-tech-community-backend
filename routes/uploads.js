import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { uploadImage } from '../controllers/uploadController.js'

const router = Router()

// ensure uploads folder exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`
    cb(null, name)
  }
})

const upload = multer({ storage })

// POST /api/uploads - single image (uses controller to respond)
router.post('/', upload.single('image'), uploadImage)

export default router
