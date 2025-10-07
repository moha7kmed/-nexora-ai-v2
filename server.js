// 1. استدعاء المكتبات المطلوبة
const express = require('express');
const cors = require('cors'); // استخدام مكتبة cors الاحترافية
const fs = require('fs').promises; // استخدام النسخة التي تدعم الـ Promises للعمليات غير المتزامنة
const path = require('path');

// 2. إعداد تطبيق Express
const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Middleware لمعالجة CORS تلقائياً
app.use(express.json()); // Middleware لمعالجة الطلبات بصيغة JSON


// 3. تحديد مسارات ملفات قاعدة البيانات
const USERS_DB_PATH = path.join(__dirname, 'users.json');
const MESSAGES_DB_PATH = path.join(__dirname, 'messages.json');

// 4. دوال مساعدة للتعامل مع الملفات (مع تحسينات)

// دالة لكتابة المستخدمين في ملف users.json
const writeUsers = async (users) => {
    try {
        await fs.writeFile(USERS_DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing to users.json:", error);
        throw error;
    }
};

// دالة لقراءة المستخدمين من ملف users.json (أكثر قوة)
const readUsers = async () => {
    try {
        const data = await fs.readFile(USERS_DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            console.log(`users.json not found or corrupted. Initializing a new one.`);
            await writeUsers([]);
            return [];
        }
        console.error("An unexpected error occurred while reading users.json:", error);
        throw error;
    }
};

// دالة لكتابة الرسائل في ملف messages.json
const writeMessages = async (messages) => {
    try {
        await fs.writeFile(MESSAGES_DB_PATH, JSON.stringify(messages, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing to messages.json:", error);
        throw error;
    }
};

// دالة لقراءة الرسائل من ملف messages.json (أكثر قوة)
const readMessages = async () => {
    try {
        const data = await fs.readFile(MESSAGES_DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            console.log(`messages.json not found or corrupted. Initializing a new one.`);
            await writeMessages([]);
            return [];
        }
        console.error("An unexpected error occurred while reading messages.json:", error);
        throw error;
    }
};


// 5. إنشاء المسارات (Routes)

// ✅ GET /search?name=اسم
app.get('/search', async (req, res) => {
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ error: 'يجب توفير اسم للبحث' });
    }

    try {
        const users = await readUsers();
        const searchResults = users
            .filter(user => user.name.toLowerCase().includes(name.toLowerCase()))
            .map(({ name, email, bio, avatar }) => ({ name, email, bio, avatar })); // إرجاع الحقول المطلوبة فقط

        res.json(searchResults);
    } catch (error) {
        console.error("Error in /search route:", error);
        res.status(500).json({ error: 'فشل في قراءة بيانات المستخدمين' });
    }
});

// ✅ POST /addUser
app.post('/addUser', async (req, res) => {
    const { name, email, bio, avatar } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'الاسم والبريد الإلكتروني حقول مطلوبة' });
    }

    try {
        const users = await readUsers();
        // التحقق مما إذا كان المستخدم موجودًا بالفعل
        if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
            // لا يعتبر خطأ، بل تحديث ضمني للبيانات أو مجرد تأكيد وجود
            console.log(`User with email ${email} already exists. Skipping add.`);
            return res.status(200).json({ success: true, message: 'User already exists' });
        }
        const newUser = { name, email, bio: bio || '', avatar: avatar || '' };
        users.push(newUser);
        await writeUsers(users);
        res.status(201).json({ success: true });
    } catch (error) {
        console.error("Error in /addUser route:", error);
        res.status(500).json({ error: 'فشل في إضافة مستخدم جديد' });
    }
});

// ✅ POST /sendMessage
app.post('/sendMessage', async (req, res) => {
    const { fromUser, toUser, message } = req.body;
    if (!fromUser || !toUser || !message) {
        return res.status(400).json({ error: 'fromUser, toUser, message حقول مطلوبة' });
    }
    
    try {
        const messages = await readMessages();
        const newMessage = {
            fromUser,
            toUser,
            message,
            timestamp: new Date().toISOString()
        };
        messages.push(newMessage);
        await writeMessages(messages);
        res.status(201).json({ success: true });
    } catch (error) {
        console.error("Error in /sendMessage route:", error);
        res.status(500).json({ error: 'فشل في إرسال الرسالة' });
    }
});

// ✅ GET /getMessages?user1=اسم1&user2=اسم2
app.get('/getMessages', async (req, res) => {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
        return res.status(400).json({ error: 'user1 و user2 حقول مطلوبة' });
    }

    try {
        const messages = await readMessages();
        const conversation = messages
            .filter(msg =>
                (msg.fromUser === user1 && msg.toUser === user2) ||
                (msg.fromUser === user2 && msg.toUser === user1)
            )
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // ترتيب الرسائل زمنيًا

        res.json(conversation);
    } catch (error) {
        console.error("Error in /getMessages route:", error);
        res.status(500).json({ error: 'فشل في استرجاع الرسائل' });
    }
});


// 6. تشغيل الخادم (بطريقة آمنة)
const startServer = async () => {
    try {
        // التأكد من وجود الملفات وصلاحيتها عند بدء التشغيل
        console.log('Initializing databases...');
        await readUsers();
        await readMessages();
        console.log('Databases initialized successfully.');
        
        app.listen(PORT, () => {
            console.log(`🚀 خادم Nexora شغال على http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("FATAL: Could not start the Nexora server due to a database error.", error);
        process.exit(1); // إنهاء العملية إذا فشل بدء التشغيل
    }
};

startServer();
