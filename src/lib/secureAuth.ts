import { supabase } from "@/integrations/supabase/client";

// مفتاح التشفير الخاص بالموقع (سري ولا يخرج من المتصفح)
const SECRET_SALT = "NXR_2026_AE5_SUPER_SECURE_SALT_$#99";

// خوارزمية تشفير بسيطة وفعالة للاستخدام المحلي في المتصفح لتشويش البيانات تماماً
export const encryptData = (data: any): string => {
    try {
        const jsonStr = JSON.stringify(data);
        const salted = jsonStr + SECRET_SALT;
        // Base64 encoding with a twist to avoid straightforward decoding
        const b64 = btoa(encodeURIComponent(salted));
        return b64.split('').reverse().join('');
    } catch (e) {
        return "";
    }
};

export const decryptData = (encryptedStr: string): any => {
    try {
        if (!encryptedStr) return [];
        // Reverse twist
        const b64 = encryptedStr.split('').reverse().join('');
        const decoded = decodeURIComponent(atob(b64));

        // Remove salt
        if (decoded.endsWith(SECRET_SALT)) {
            const jsonStr = decoded.substring(0, decoded.length - SECRET_SALT.length);
            return JSON.parse(jsonStr);
        }
        return [];
    } catch (e) {
        console.error("Decryption failed. Data might be corrupted or tampered with.");
        return [];
    }
};

// وظائف للتحكم المباشر في ملفات الحسابات المشفرة
export const AuthFiles = {
    getAdminFile: async () => await fetchEncryptedFile('admin_auth_file'),
    getTeamFile: async () => await fetchEncryptedFile('team_auth_file'),
    getClientFile: async () => await fetchEncryptedFile('client_auth_file'),

    saveAdminFile: async (data: any[]) => await saveEncryptedFile('admin_auth_file', data),
    saveTeamFile: async (data: any[]) => await saveEncryptedFile('team_auth_file', data),
    saveClientFile: async (data: any[]) => await saveEncryptedFile('client_auth_file', data),
};

const fetchEncryptedFile = async (fileType: string) => {
    const { data, error } = await supabase
        .from('system_auth_files')
        .select('encrypted_content')
        .eq('file_type', fileType)
        .maybeSingle();

    if (error || !data || !data.encrypted_content) return [];
    return decryptData(data.encrypted_content);
};

const saveEncryptedFile = async (fileType: string, dataArray: any[]) => {
    const encryptedStr = encryptData(dataArray);
    const { error } = await supabase
        .from('system_auth_files')
        .upsert({ file_type: fileType, encrypted_content: encryptedStr }, { onConflict: 'file_type' });

    if (error) throw error;
    return true;
};
