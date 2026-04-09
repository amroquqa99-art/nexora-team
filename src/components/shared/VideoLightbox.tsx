import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type VideoLightboxProps = {
  project: {
    title: string;
    description: string;
    thumbnail: string;
    videoUrl?: string;
  };
  onClose: () => void;
};

const VideoLightbox = ({ project, onClose }: VideoLightboxProps) => {
  const getEmbedUrl = (url?: string) => {
    if (!url) return null;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Google Drive
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    return url;
  };

  const embedUrl = getEmbedUrl(project.videoUrl);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card w-full max-w-3xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="aspect-video bg-muted">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <img
                src={project.thumbnail}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="p-4">
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoLightbox;
