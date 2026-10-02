import { useRef, useState } from "react";

import { uploadProfilePhoto } from "../../api/teacherApi";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

function PhotoUploadField({ value, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const profile = await uploadProfilePhoto(file);
      onUploaded(profile.photoUrl);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Profile Photo</label>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`cursor-pointer flex items-center gap-4 border-2 border-dashed rounded-xl p-4 transition-colors ${
          isDragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-slate-300 hover:border-indigo-400"
        }`}
      >
        {value ? (
          <img src={value} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
            📷
          </div>
        )}

        <div className="text-sm">
          <p className="text-indigo-600 font-medium">
            {uploading ? "Uploading..." : "Click or drag a photo here"}
          </p>
          <p className="text-slate-400">JPEG, PNG, or WEBP — up to 5MB</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default PhotoUploadField;
