// supabase/functions/upload-to-drive/index.ts - النسخة النهائية
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:googleapis@126.0.0"
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";

console.log("SERVER: V14 - Turbo Fast Load (CDN + Range Support)")

serve(async (req) => {
  // 🔐 CORS مقيّد بالنطاقات المعتمدة فقط
  const allowedOrigins = [
    'https://timeeqkhoxhvxlgcxlcz.supabase.co',
    'http://localhost:3000',
    'https://islamic-studiess.onrender.com', // النطاق الفعلي للموقع
  ];
  const origin = req.headers.get('origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-student-id, x-file-name, cache-control, pragma, range',
    'Access-Control-Expose-Headers': 'Content-Range, X-Content-Range, Content-Length, Accept-Ranges, Cache-Control',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN')

    if (!clientId || !clientSecret || !refreshToken) throw new Error("Missing Secrets");

    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth });

    // --- GET: تحميل الملف السريع ---
    if (req.method === 'GET') {
        const url = new URL(req.url);
        const fileId = url.searchParams.get('id');
        const download = url.searchParams.get('download');
        
        if (!fileId) throw new Error("File ID required");

        // تحسين للـ PDF: إرجاع مع هيدرات التخزين المؤقت
        const responseHeaders: any = {
            ...corsHeaders,
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            'Accept-Ranges': 'bytes',
            'X-Content-Type-Options': 'nosniff',
        };

        if (download === 'true') {
            // للتحميل المباشر
            const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            return Response.redirect(downloadUrl, 302);
        }

        // للعرض: دعم Range requests
        const range = req.headers.get('range');
        const googleHeaders: any = {};
        if (range) {
            googleHeaders['Range'] = range;
            responseHeaders['Vary'] = 'Range';
        }

        try {
            const response = await drive.files.get(
                { fileId: fileId, alt: 'media' },
                { responseType: 'stream', headers: googleHeaders }
            );

            // إضافة نوع المحتوى
            responseHeaders['Content-Type'] = response.headers['content-type'] || 'application/octet-stream';
            
            // تمرير هيدرات النطاق
            if (response.headers['content-range']) {
                responseHeaders['Content-Range'] = response.headers['content-range'];
            }
            if (response.headers['content-length']) {
                responseHeaders['Content-Length'] = response.headers['content-length'];
            }

            // تحديد حالة الرد
            const status = range ? 206 : 200;

            return new Response(response.data as any, {
                status,
                headers: responseHeaders
            });

        } catch (error) {
            // في حالة الخطأ، إرجاع رابط مباشر بديل
            const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
            return Response.redirect(directUrl, 302);
        }
    }

    // --- POST: رفع الملف ---
    if (req.method === 'POST') {
        const studentId = req.headers.get('x-student-id')
        const encodedFileName = req.headers.get('x-file-name')
        const folderId = Deno.env.get('DRIVE_FOLDER_ID')

        if (!studentId || !encodedFileName || !folderId) {
            throw new Error("Missing Data: studentId, fileName, or folderId");
        }

        // 🔐 التحقق من نوع الملف (whitelist)
        const contentType = req.headers.get('content-type') || '';
        const allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'video/mp4', 'video/quicktime', 'video/webm',
            'audio/mpeg', 'audio/wav', 'audio/ogg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const isAllowed = allowedMimeTypes.some(t => contentType.startsWith(t));
        if (!isAllowed) {
            return new Response(
                JSON.stringify({ error: 'نوع الملف غير مسموح به' }),
                { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const arrayBuffer = await req.arrayBuffer();

        // 🔐 التحقق من حجم الملف (50MB حد أقصى)
        const MAX_SIZE = 50 * 1024 * 1024;
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Empty File");
        }
        if (arrayBuffer.byteLength > MAX_SIZE) {
            return new Response(
                JSON.stringify({ error: 'حجم الملف يتجاوز الحد المسموح (50MB)' }),
                { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
        
        const fileBuffer = Buffer.from(arrayBuffer);
        const fileStream = Readable.from(fileBuffer);

        const fileName = decodeURIComponent(encodedFileName);
        const timestamp = Date.now();
        const uniqueFileName = `${studentId}_${timestamp}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        // رفع الملف إلى Drive
        const uploadRes = await drive.files.create({
            requestBody: {
                name: uniqueFileName,
                parents: [folderId],
                mimeType: req.headers.get('content-type') || 'application/octet-stream',
            },
            media: {
                mimeType: req.headers.get('content-type') || 'application/octet-stream',
                body: fileStream,
            },
            fields: 'id, mimeType, size',
        });

        // السماح للجميع بالقراءة
        await drive.permissions.create({
            fileId: uploadRes.data.id!,
            requestBody: { role: 'reader', type: 'anyone' },
        });

        // إنشاء رابطين: CDN للصور، ورابط مباشر للبقية
        const mimeType = uploadRes.data.mimeType || '';
        const fileSize = uploadRes.data.size || '0';
        const directUrl = `https://drive.google.com/uc?export=view&id=${uploadRes.data.id}`;
        
        let optimizedUrl = directUrl;
        let cdnUrl = null;
        
        // إذا كان الملف صورة، استخدم الـ CDN
        if (mimeType.startsWith('image/')) {
            cdnUrl = `https://lh3.googleusercontent.com/d/${uploadRes.data.id}`;
            optimizedUrl = cdnUrl;
        }

        return new Response(
            JSON.stringify({ 
                success: true, 
                url: optimizedUrl, // الرابط المحسن (CDN للصور، مباشر للبقية)
                directUrl: directUrl, // الرابط المباشر كاحتياطي
                cdnUrl: cdnUrl, // رابط CDN (للصور فقط)
                fileId: uploadRes.data.id,
                mimeType: mimeType,
                fileSize: fileSize,
                fileName: uniqueFileName,
                timestamp: timestamp
            }),
            { 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                } 
            },
        );
    }

    throw new Error(`Method ${req.method} not allowed`);

  } catch (error) {
    // 🔐 لا نكشف تفاصيل الخطأ الداخلي للمستخدم
    console.error("SERVER ERROR:", error);
    return new Response(
        JSON.stringify({ 
            error: 'حدث خطأ في معالجة الطلب. يرجى المحاولة مجدداً.',
            code: (error as any).code || 'UNKNOWN_ERROR'
        }), 
        { 
            status: 400, 
            headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
            } 
        }
    );
  }
});