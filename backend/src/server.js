import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { v4 as uuid } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PROJECT_ROOT = path.resolve(ROOT_DIR, "..");

const envCandidates = [
  path.join(ROOT_DIR, ".env"),
  path.join(PROJECT_ROOT, ".env"),
];

for (const candidate of envCandidates) {
  dotenv.config({ path: candidate, override: false });
}

// Detect if running on Vercel (serverless) - use /tmp for writable storage
const IS_VERCEL = process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");
const STORAGE_BASE = IS_VERCEL ? "/tmp" : ROOT_DIR;

const DATA_DIR = path.join(STORAGE_BASE, "data");
const UPLOADS_DIR = path.join(STORAGE_BASE, "uploads");

const DESIGNS_FILE = path.join(DATA_DIR, "designs.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

const app = express();
const PORT = process.env.PORT || 8080;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const INITIAL_ADMIN_TOKEN = process.env.ADMIN_TOKEN?.trim();
const DEFAULT_ADMIN_EMAIL = "sheetalgawas27@gmail.com";

// Allow multiple origins for development and production
const allowedOrigins = [
  CLIENT_ORIGIN,
  "http://localhost:3000",
  "https://mehandi-three.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

// Serve uploads via route handler (works better with /tmp on Vercel)
app.get("/uploads/:filename", async (req, res, next) => {
  try {
    const filename = req.params.filename;
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    let filePath = path.resolve(UPLOADS_DIR, safeFilename);
    let found = false;
    
    try {
      await fs.access(filePath);
      found = true;
    } catch {
      // If file doesn't exist in /tmp, try original location (for Vercel)
      if (IS_VERCEL) {
        const originalPath = path.resolve(ROOT_DIR, "uploads", safeFilename);
        try {
          await fs.access(originalPath);
          filePath = originalPath;
          found = true;
        } catch {
          // File not found in either location
        }
      }
    }
    
    if (found) {
      // Set appropriate content type based on file extension
      const ext = path.extname(safeFilename).toLowerCase();
      const contentTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.webm': 'video/webm',
      };
      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } catch (error) {
    console.error("Error serving upload file:", error);
    next(error);
  }
});

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_, file, cb) => {
    const timestamp = Date.now();
    const uniqueSuffix = `${timestamp}-${file.originalname}`;
    cb(null, uniqueSuffix.replace(/\s+/g, "_"));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
  fileFilter: (_, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/quicktime",
      "video/webm",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

const MEHANDI_TYPES = [
  {
    id: "traditional",
    name: "Traditional Bridal Mehandi",
    description:
      "Intricate paisleys, lotus blooms, and fine detailing for bridal celebrations.",
  },
  {
    id: "arabic",
    name: "Arabic Mehandi",
    description:
      "Flowing floral patterns with bold outlines and empty spaces for elegance.",
  },
  {
    id: "indo-arabic",
    name: "Indo-Arabic Mehandi",
    description:
      "A fusion of Indian motifs with Arabic floral accents for festive occasions.",
  },
  {
    id: "minimal",
    name: "Minimal & Contemporary",
    description:
      "Clean, modern designs with delicate detailing for intimate functions.",
  },
  {
    id: "khatri",
    name: "Khatri Traditional",
    description:
      "Geometric shapes and symmetric patterns inspired by Khatri artisans.",
  },
];

async function getConfig() {
  const data = await fs.readFile(CONFIG_FILE, "utf-8");
  return JSON.parse(data);
}

async function requireAdmin(req, res, next) {
  try {
    const config = await getConfig();
    const configuredToken = config?.adminToken?.trim();

    if (!configuredToken) {
      return res
        .status(500)
        .json({ error: "Admin token is not configured on the server." });
    }

    const requestToken = req.get("x-admin-token");
    const normalized = requestToken?.trim() ?? "";

    if (!normalized || normalized !== configuredToken) {
      return res.status(401).json({ error: "Unauthorized admin access." });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  
  // On Vercel, copy initial data from read-only repo files to /tmp
  if (IS_VERCEL) {
    const originalDataDir = path.join(ROOT_DIR, "data");
    const originalDesignsFile = path.join(originalDataDir, "designs.json");
    const originalBookingsFile = path.join(originalDataDir, "bookings.json");
    const originalConfigFile = path.join(originalDataDir, "config.json");
    
    // Copy designs.json if it exists in repo
    try {
      const designsData = await fs.readFile(originalDesignsFile, "utf-8");
      await fs.writeFile(DESIGNS_FILE, designsData, "utf-8");
    } catch {
      // File doesn't exist, will create empty array below
    }
    
    // Copy bookings.json if it exists in repo
    try {
      const bookingsData = await fs.readFile(originalBookingsFile, "utf-8");
      await fs.writeFile(BOOKINGS_FILE, bookingsData, "utf-8");
    } catch {
      // File doesn't exist, will create empty array below
    }
    
    // Copy config.json if it exists in repo
    try {
      const configData = await fs.readFile(originalConfigFile, "utf-8");
      await fs.writeFile(CONFIG_FILE, configData, "utf-8");
    } catch {
      // File doesn't exist, will create below
    }
    
    // Copy existing upload files from repo to /tmp
    const originalUploadsDir = path.join(ROOT_DIR, "uploads");
    try {
      const files = await fs.readdir(originalUploadsDir);
      for (const file of files) {
        try {
          const originalFilePath = path.join(originalUploadsDir, file);
          const stats = await fs.stat(originalFilePath);
          if (stats.isFile()) {
            const fileData = await fs.readFile(originalFilePath);
            await fs.writeFile(path.join(UPLOADS_DIR, file), fileData);
          }
        } catch (err) {
          console.warn(`Failed to copy upload file ${file}:`, err.message);
        }
      }
    } catch {
      // Uploads directory doesn't exist or is empty
    }
  }
  
  for (const filePath of [DESIGNS_FILE, BOOKINGS_FILE]) {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, "[]", "utf-8");
    }
  }

  try {
    let config;
    let originalRaw = "";
    let configNeedsWrite = false;
    
    try {
      const raw = await fs.readFile(CONFIG_FILE, "utf-8");
      config = JSON.parse(raw);
      originalRaw = raw;
    } catch {
      // If config doesn't exist in /tmp, try to read from original location on Vercel
      if (IS_VERCEL) {
        try {
          const originalConfigFile = path.join(ROOT_DIR, "data", "config.json");
          const raw = await fs.readFile(originalConfigFile, "utf-8");
          config = JSON.parse(raw);
          originalRaw = raw;
          configNeedsWrite = true; // Always write to /tmp if we read from original
        } catch {
          config = {};
          configNeedsWrite = true;
        }
      } else {
        config = {};
        configNeedsWrite = true;
      }
    }

    if (
      !config.adminToken ||
      typeof config.adminToken !== "string" ||
      config.adminToken.trim().length < 4
    ) {
      const fallbackToken =
        (INITIAL_ADMIN_TOKEN && INITIAL_ADMIN_TOKEN.length >= 4
          ? INITIAL_ADMIN_TOKEN
          : `token-${uuid()}`) ?? `token-${uuid()}`;
      if (!INITIAL_ADMIN_TOKEN) {
        console.warn(
          "ADMIN_TOKEN not provided; generating a temporary token. Please update it via the admin dashboard.",
        );
      }
      config.adminToken = fallbackToken;
      configNeedsWrite = true;
    }

    if (
      !config.adminEmail ||
      typeof config.adminEmail !== "string" ||
      config.adminEmail.trim().length === 0
    ) {
      config.adminEmail = DEFAULT_ADMIN_EMAIL;
      configNeedsWrite = true;
    }

    const updatedRaw = JSON.stringify(config, null, 2);
    if (configNeedsWrite || originalRaw.trim() !== updatedRaw.trim()) {
      await fs.writeFile(CONFIG_FILE, `${updatedRaw}\n`, "utf-8");
    }
  } catch (error) {
    console.error("Failed to ensure config file:", error);
    throw error;
  }
}

async function readJsonArray(filePath) {
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

async function writeJsonArray(filePath, array) {
  await fs.writeFile(filePath, JSON.stringify(array, null, 2), "utf-8");
}

async function sendBookingEmail(booking) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    ADMIN_EMAIL,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "SMTP credentials are not fully configured. Booking email skipped.",
    );
    return;
  }

  let adminRecipient =
    (ADMIN_EMAIL && ADMIN_EMAIL.trim().length > 0
      ? ADMIN_EMAIL.trim()
      : SMTP_USER?.trim()) ?? "";

  if (!adminRecipient) {
    try {
      const config = await getConfig();
      adminRecipient = config?.adminEmail?.trim() || DEFAULT_ADMIN_EMAIL;
    } catch {
      adminRecipient = DEFAULT_ADMIN_EMAIL;
    }
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const message = {
    from: `"Mehandi Bookings" <${SMTP_USER}>`,
    to: adminRecipient,
    subject: `New Mehandi Booking: ${booking.name}`,
    text: `A new mehandi booking has been submitted.

Name: ${booking.name}
Email: ${booking.email}
Phone: ${booking.phone}
Event Date: ${booking.eventDate ?? "Not provided"}
Preferred Style: ${booking.preferredStyle ?? "Not provided"}
Preferred Design IDs: ${
      booking.selectedDesignIds?.length
        ? booking.selectedDesignIds.join(", ")
        : "None"
    }

Message:
${booking.message ?? "No additional message"}
`,
  };

  try {
    const result = await transporter.sendMail(message);
    console.log("Email sent successfully:", result);
    console.log("Booking email sent to admin.");
  } catch (error) {
    console.error("Failed to send booking email:", error.message);
  }
}

app.get("/", (_, res) => {
  res.json({ status: "ok", message: "Mehandi API running" });
});

app.get("/api/types", (_, res) => {
  res.json(MEHANDI_TYPES);
});

app.get("/api/designs", async (_, res, next) => {
  try {
    const designs = await readJsonArray(DESIGNS_FILE);
    res.json(designs);
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/admin/designs",
  requireAdmin,
  upload.single("media"),
  async (req, res, next) => {
    try {
      const designs = await readJsonArray(DESIGNS_FILE);
      const { title, description, category, mediaType } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title is a required field." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Media file is required." });
      }

      const design = {
        id: uuid(),
        title,
        description: description ?? "",
        category: category ?? "general",
        mediaType: mediaType && !mediaType.includes("/")
          ? req.file.mimetype
          : req.file.mimetype ?? mediaType,
        mediaUrl: `/uploads/${req.file.filename}`,
        originalFileName: req.file.originalname,
        createdAt: new Date().toISOString(),
      };

      designs.push(design);
      await writeJsonArray(DESIGNS_FILE, designs);

      res.status(201).json(design);
    } catch (error) {
      next(error);
    }
  },
);

app.delete("/api/admin/designs/:id", requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const designs = await readJsonArray(DESIGNS_FILE);
    const index = designs.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Design not found." });
    }

    const [removed] = designs.splice(index, 1);
    await writeJsonArray(DESIGNS_FILE, designs);

    if (removed?.mediaUrl) {
      const relativePath = removed.mediaUrl.replace(/^\/*/, "");
      const filePath = path.join(STORAGE_BASE, relativePath);
      fs.unlink(filePath).catch(() => {
        console.warn(`Failed to delete file ${filePath}`);
      });
    }

    res.json({ message: "Design removed." });
  } catch (error) {
    next(error);
  }
});

app.post("/api/bookings", async (req, res, next) => {
  try {
    const { name, email, phone, eventDate, message, preferredStyle } =
      req.body || {};
    const selectedDesignIds = req.body?.selectedDesignIds ?? [];

    if (!name || !email || !phone) {
      return res
        .status(400)
        .json({ error: "Name, email, and phone are required." });
    }

    const bookings = await readJsonArray(BOOKINGS_FILE);
    const booking = {
      id: uuid(),
      name,
      email,
      phone,
      eventDate: eventDate ?? null,
      preferredStyle: preferredStyle ?? null,
      selectedDesignIds,
      message: message ?? "",
      submittedAt: new Date().toISOString(),
    };

    bookings.push(booking);
    await writeJsonArray(BOOKINGS_FILE, bookings);
    await sendBookingEmail(booking);

    res.status(201).json({ message: "Booking submitted.", booking });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/bookings", requireAdmin, async (req, res, next) => {
  try {
    const bookings = await readJsonArray(BOOKINGS_FILE);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/bookings/:id", requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookings = await readJsonArray(BOOKINGS_FILE);
    const index = bookings.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Booking not found." });
    }

    bookings.splice(index, 1);
    await writeJsonArray(BOOKINGS_FILE, bookings);

    res.json({ message: "Booking removed." });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/bookings", requireAdmin, async (req, res, next) => {
  try {
    await writeJsonArray(BOOKINGS_FILE, []);
    res.json({ message: "All bookings cleared." });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/token", requireAdmin, async (req, res, next) => {
  try {
    const { newToken } = req.body || {};
    const trimmed = newToken?.trim() ?? "";

    if (trimmed.length < 4) {
      return res
        .status(400)
        .json({ error: "New access token must be at least 4 characters." });
    }

    const currentConfig = await getConfig();
    currentConfig.adminToken = trimmed;
    await fs.writeFile(
      CONFIG_FILE,
      JSON.stringify(currentConfig, null, 2),
      "utf-8",
    );

    res.json({ message: "Admin access token updated." });
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal Server Error" });
});

ensureDataFiles()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Mehandi backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize data files:", error);
    process.exit(1);
  });

