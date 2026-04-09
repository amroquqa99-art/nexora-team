import { 
  Film, 
  Palette, 
  Sparkles, 
  Share2, 
  Layers, 
  Megaphone, 
  Briefcase,
  Video,
  Layout,
  Globe,
  Camera,
  Music,
  Zap,
  Star,
  Search,
  MessageSquare,
  Users,
  Settings,
  Mail,
  Phone,
  Monitor,
  Cpu,
  Database,
  Cloud,
  Lock,
  Smartphone,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Github,
  Link as LinkIcon,
  Send,
  MessageCircle,
  Ghost
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Film,
  Palette,
  Sparkles,
  Share2,
  Layers,
  Megaphone,
  Briefcase,
  Video,
  Layout,
  Globe,
  Camera,
  Music,
  Zap,
  Star,
  Search,
  MessageSquare,
  Users,
  Settings,
  Mail,
  Phone,
  Monitor,
  Cpu,
  Database,
  Cloud,
  Lock,
  Smartphone,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Github,
  LinkIcon,
  Send,
  MessageCircle,
  "tiktok": Music,
  "snapchat": Ghost
};

export const getPlatformFromUrl = (url: string): string => {
  if (!url) return "";
  const lower = url.toLowerCase();
  
  if (lower.includes("facebook.com") || lower.includes("fb.com") || lower.includes("fb.me")) return "facebook";
  if (lower.includes("instagram.com") || lower.includes("instagr.am")) return "instagram";
  if (lower.includes("linkedin.com")) return "linkedin";
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "twitter";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("github.com")) return "github";
  if (lower.includes("t.me") || lower.includes("telegram.org")) return "telegram";
  if (lower.includes("wa.me") || lower.includes("whatsapp.com")) return "whatsapp";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("snapchat.com")) return "snapchat";
  if (lower.includes("behance.net")) return "behance";
  if (lower.includes("mailto:")) return "mail";
  if (lower.includes("tel:")) return "phone";
  
  return "";
};

export const getIcon = (name: string): LucideIcon => {
  if (!name) return Briefcase;
  
  const lower = name.toLowerCase().trim();
  
  // Custom platform matching based on keywords or IDs
  if (lower.includes("instagram") || lower.includes("انستغرام") || lower.includes("انستا")) return Instagram;
  if (lower.includes("linkedin") || lower.includes("لينكد") || lower.includes("لينكدان")) return Linkedin;
  if (lower.includes("twitter") || lower.includes("x.com") || lower.includes("تويتر")) return Twitter;
  if (lower.includes("facebook") || lower.includes("فيسبوك") || lower.includes("فيس")) return Facebook;
  if (lower.includes("youtube") || lower.includes("يوتيوب")) return Youtube;
  if (lower.includes("github") || lower.includes("غيت") || lower.includes("قيت")) return Github;
  if (lower.includes("telegram") || lower.includes("تلغرام") || lower.includes("تليجرام")) return Send;
  if (lower.includes("whatsapp") || lower.includes("واتس")) return MessageCircle;
  if (lower.includes("tiktok") || lower.includes("تيك")) return Music;
  if (lower.includes("snapchat") || lower.includes("سناب")) return Ghost;
  if (lower.includes("behance") || lower.includes("portfolio") || lower.includes("معرض") || lower.includes("بورتفوليو")) return Palette;

  // Handle member association prefix as fallback
  if (name.startsWith("member:")) return Users;

  return iconMap[name] || Briefcase;
};

