-- Seed script for all 8 core Nexora services
TRUNCATE TABLE services CASCADE;

INSERT INTO services (key, title_ar, title_en, description_ar, description_en, icon, color, display_order)
VALUES 
(
    'branding', 
    'بناء العلامة التجارية', 
    'Branding', 
    'هذه المرحلة الأساسية لأي مشروع. تشمل تصميم الهوية البصرية الكاملة، الشعار، وتحديد الألوان والخطوط الرسمية.', 
    'The foundational stage for any project. Includes full visual identity design, logo design, and defining official colors and fonts.', 
    'Palette', 
    'from-neon-cyan to-blue-600', 
    1
),
(
    'graphic_design', 
    'التصميم الجرافيكي', 
    'Graphic Design', 
    'تشمل تصاميم السوشيال ميديا، المنشورات، الحملات الإعلانية، البروشورات، والبوسترات الرقمية.', 
    'Includes social media designs, posts, advertising campaigns, brochures, and digital posters.', 
    'Brush', 
    'from-neon-violet to-purple-600', 
    2
),
(
    'video_production', 
    'صناعة الفيديو', 
    'Video Production', 
    'مونتاج الفيديو، فيديوهات تسويقية، موشن جرافيك، وإعلانات قصيرة (Reels/TikTok).', 
    'Video editing, marketing videos, motion graphics, and short ads (Reels/TikTok).', 
    'Video', 
    'from-red-500 to-orange-500', 
    3
),
(
    'social_media', 
    'إدارة السوشيال ميديا', 
    'Social Media Management', 
    'إنشاء استراتيجية المحتوى، إدارة الحسابات، جدولة النشر، وتحليل الأداء على مختلف المنصات.', 
    'Content strategy creation, account management, scheduling, and performance analysis across platforms.', 
    'Share2', 
    'from-blue-400 to-blue-700', 
    4
),
(
    'digital_marketing', 
    'التسويق الرقمي', 
    'Digital Marketing', 
    'إعلانات فيسبوك، إنستغرام، جوجل، وتحسين نتائج الحملات التسويقية وتحليل المنافسين.', 
    'Facebook, Instagram, and Google ads, performance optimization, and competitor analysis.', 
    'TrendingUp', 
    'from-green-400 to-emerald-600', 
    5
),
(
    'web_design', 
    'تصميم وتطوير المواقع', 
    'Web Design & Development', 
    'تصميم مواقع الشركات، صفحات الهبوط، وتحسين تجربة المستخدم مع سرعة وتجاوب كامل مع الموبايل.', 
    'Corporate website design, landing pages, and UX/UI optimization with high speed and full mobile responsiveness.', 
    'Globe', 
    'from-cyan-400 to-blue-500', 
    6
),
(
    'content_creation', 
    'إنتاج المحتوى', 
    'Content Creation', 
    'كتابة المحتوى التسويقي، سكربتات الفيديو، تدوينات السوشيال ميديا، ومحتوى المواقع.', 
    'Marketing copywriting, video scripts, social media posts, and website content.', 
    'PenTool', 
    'from-amber-400 to-orange-600', 
    7
),
(
    'consulting', 
    'الاستشارات الرقمية', 
    'Consulting', 
    'استشارات بناء البراند، خطط التسويق، وضع الاستراتيجيات، وتحليل الحسابات.', 
    'Branding consultations, marketing plans, strategy development, and account analysis.', 
    'MessageCircle', 
    'from-indigo-400 to-violet-600', 
    8
);
