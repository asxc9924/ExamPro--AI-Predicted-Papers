const multer    = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Custom Cloudinary Storage Engine (works with cloudinary v2) ──
class CloudinaryStorage {
  constructor(options) {
    this.options = options;
  }

  // Called by multer to save each file
  async _handleFile(req, file, cb) {
    try {
      const opts = await this.options.params(req, file);

      // Convert the multer file stream into a Cloudinary upload stream
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder:        opts.folder,
          resource_type: opts.resource_type || "auto",
          public_id:     opts.public_id,
          type:          opts.type || "upload",
          format:        opts.format,
          transformation: opts.transformation,
          access_mode:   opts.access_mode,
        },
        (error, result) => {
          if (error) return cb(error);
          cb(null, {
            fieldname:  file.fieldname,
            originalname: file.originalname,
            filename:   result.public_id,   // Cloudinary public_id
            path:       result.secure_url,  // Full HTTPS URL
            size:       result.bytes,
            mimetype:   file.mimetype,
            cloudinary: result,             // Full Cloudinary response
          });
        }
      );

      file.stream.pipe(uploadStream);
    } catch (err) {
      cb(err);
    }
  }

  // Called by multer when a file is removed
  _removeFile(req, file, cb) {
    if (file.filename) {
      const resourceType = file.mimetype === "application/pdf" ? "raw" : "image";
      cloudinary.uploader.destroy(file.filename, { resource_type: resourceType })
        .then(() => cb(null))
        .catch(cb);
    } else {
      cb(null);
    }
  }
}

// ── Use memoryStorage for multer then stream to Cloudinary ──────
// This avoids temp file issues on serverless / Render free tier
const memoryStorage = multer.memoryStorage();

// Helper: convert Buffer → Readable stream for Cloudinary upload_stream
const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

// ── Upload helpers using memory storage ─────────────────────────
const createMemoryUpload = (limits = {}) =>
  multer({ storage: memoryStorage, limits });

// Middleware that streams from memory → Cloudinary after multer collects it
const streamToCloudinary = (fieldName, folder, resourceType = "image", opts = {}) =>
  async (req, res, next) => {
    if (!req.file && !req.files) return next();

    const processFile = async (file) => {
      if (!file) return null;
      const public_id = `${folder.split("/").pop()}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
            public_id,
            type:          resourceType === "raw" ? "authenticated" : "upload",
            ...opts,
          },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        bufferToStream(file.buffer).pipe(uploadStream);
      });
    };

    try {
      if (req.file) {
        const result = await processFile(req.file);
        req.file.path     = result.secure_url;
        req.file.filename = result.public_id;
        req.file.cloudinary = result;
      }

      if (req.files) {
        // Handle fields() - req.files is an object of arrays
        if (!Array.isArray(req.files)) {
          for (const [field, files] of Object.entries(req.files)) {
            const isRaw = field === "pdf";
            for (const file of files) {
              const result = await processFile({
                ...file,
                folder: isRaw ? "examedge/papers" : "examedge/thumbnails",
                resourceType: isRaw ? "raw" : "image",
              });
              file.path     = result.secure_url;
              file.filename = result.public_id;
              file.cloudinary = result;
            }
          }
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };

// ── File filters ─────────────────────────────────────────────────
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

// ── Exported multer instances (memory-based, then stream to Cloudinary) ─
exports.uploadPDF = {
  single: (field) => [
    createMemoryUpload({ fileSize: 50 * 1024 * 1024 }).single(field),
    streamToCloudinary(field, "examedge/papers", "raw"),
  ],
  fields: (fields) => [
    createMemoryUpload({ fileSize: 50 * 1024 * 1024 }).fields(fields),
    async (req, res, next) => {
      if (!req.files) return next();
      try {
        for (const [fieldName, files] of Object.entries(req.files)) {
          const isRaw     = fieldName === "pdf";
          const folder    = isRaw ? "examedge/papers" : "examedge/thumbnails";
          const resType   = isRaw ? "raw" : "image";
          for (const file of files) {
            const public_id = `${fieldName}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
            const result = await new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { folder, resource_type: resType, public_id, type: isRaw ? "authenticated" : "upload" },
                (err, r) => err ? reject(err) : resolve(r)
              );
              bufferToStream(file.buffer).pipe(stream);
            });
            file.path     = result.secure_url;
            file.filename = result.public_id;
            file.cloudinary = result;
          }
        }
        next();
      } catch (err) { next(err); }
    },
  ],
};

exports.uploadImage = {
  single: (field) => [
    createMemoryUpload({ fileSize: 5 * 1024 * 1024 }).single(field),
    async (req, res, next) => {
      if (!req.file) return next();
      try {
        const public_id = `thumb_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "examedge/thumbnails",
              resource_type: "image",
              public_id,
              transformation: [{ width: 800, height: 450, crop: "fill", quality: "auto", fetch_format: "auto" }],
            },
            (err, r) => err ? reject(err) : resolve(r)
          );
          bufferToStream(req.file.buffer).pipe(stream);
        });
        req.file.path     = result.secure_url;
        req.file.filename = result.public_id;
        req.file.cloudinary = result;
        next();
      } catch (err) { next(err); }
    },
  ],
};

// ── Delete from Cloudinary ────────────────────────────────────────
exports.deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error(`Failed to delete ${publicId} from Cloudinary:`, err.message);
  }
};

// ── Generate signed URL for protected PDF (1 hour default) ───────
exports.generateSignedUrl = (publicId, expiresInSeconds = 3600) => {
  return cloudinary.url(publicId, {
    resource_type: "raw",
    type:          "authenticated",
    sign_url:      true,
    expires_at:    Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
};
