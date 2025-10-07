export type Action = 
  | { type: 'email'; recipient: string; subject: string; body: string }
  | { type: 'call'; number: string }
  | { type: 'sms'; number: string; message: string }
  | { type: 'open_url'; url: string }
  | { type: 'youtube_search'; query: string }
  | { type: 'send_im'; platform: 'whatsapp' | 'telegram' | 'messenger'; recipient: string; message: string };

export type SpecialistMode = string | null;

export interface Settings {
    theme: 'light' | 'dark' | 'system';
    gender: 'male' | 'female';
    aiPersonality: 'shabrawy' | 'professional' | 'philosopher' | 'humorous';
    aiTemperature: number;
    saveHistory: boolean;
    userApiKey: string | null;
    thinkingMode: 'light' | 'standard' | 'extended' | 'heavy';
    showChatSuggestions: boolean;
}

type Subject = { key: NonNullable<SpecialistMode>; name: string };
type SubjectCategory = { category: string; subjects: Subject[] };

export const PROGRAMMING_SUBJECTS: SubjectCategory[] = [
    {
        category: 'أساسيات وهياكل',
        subjects: [
            { key: 'programmer', name: 'مبرمج عام' },
            { key: 'algorithms_expert', name: 'الخوارزميات وهياكل البيانات' },
            { key: 'database_expert', name: 'قواعد البيانات (SQL & NoSQL)' },
        ]
    },
    {
        category: 'تطوير الويب: الواجهة الأمامية (Frontend)',
        subjects: [
            { key: 'frontend_expert', name: 'خبير واجهة أمامية' },
            { key: 'javascript_expert', name: 'JavaScript / TypeScript' },
            { key: 'react_expert', name: 'React / Next.js' },
            { key: 'vue_expert', name: 'Vue.js / Nuxt.js' },
            { key: 'angular_expert', name: 'Angular' },
            { key: 'html_css_expert', name: 'HTML / CSS' },
        ]
    },
    {
        category: 'تطوير الويب: الواجهة الخلفية (Backend)',
        subjects: [
            { key: 'backend_expert', name: 'خبير واجهة خلفية' },
            { key: 'nodejs_expert', name: 'Node.js / Express' },
            { key: 'python_django_expert', name: 'Python (Django / Flask)' },
            { key: 'java_spring_expert', name: 'Java (Spring Boot)' },
            { key: 'php_laravel_expert', name: 'PHP (Laravel)' },
            { key: 'ruby_rails_expert', name: 'Ruby on Rails' },
            { key: 'golang_expert', name: 'Go (Golang)' },
        ]
    },
    {
        category: 'تطوير تطبيقات الموبايل',
        subjects: [
            { key: 'mobile_expert', name: 'خبير تطبيقات الموبايل' },
            { key: 'swift_expert', name: 'Swift (iOS)' },
            { key: 'kotlin_expert', name: 'Kotlin (Android)' },
            { key: 'react_native_expert', name: 'React Native' },
        ]
    },
    {
        category: 'الذكاء الاصطناعي وعلوم البيانات',
        subjects: [
            { key: 'ai_expert', name: 'الذكاء الاصطناعي (عام)' },
            { key: 'python_datascience_expert', name: 'Python (Pandas, NumPy)' },
            { key: 'ml_expert', name: 'تعلم الآلة (Scikit-learn)' },
            { key: 'deeplearning_expert', name: 'التعلم العميق (TensorFlow, PyTorch)' },
        ]
    },
    {
        category: 'DevOps والأمن السيبراني',
        subjects: [
            { key: 'devops_expert', name: 'DevOps (Docker, Kubernetes)' },
            { key: 'cloud_expert', name: 'الحوسبة السحابية (AWS, Azure, GCP)' },
            { key: 'cybersecurity_expert', name: 'الأمن السيبراني' },
        ]
    },
    {
        category: 'لغات وتخصصات تانية',
        subjects: [
            { key: 'c++_expert', name: 'C++' },
            { key: 'csharp_expert', name: 'C# (.NET)' },
            { key: 'java_expert', name: 'Java (عام)' },
            { key: 'rust_expert', name: 'Rust' },
            { key: 'game_dev_expert', name: 'تطوير الألعاب (Unity, Unreal)' },
        ]
    }
];


export const SUBJECT_CATEGORIES: SubjectCategory[] = [
  {
    category: 'البرمجة وعلوم الكمبيوتر',
    subjects: PROGRAMMING_SUBJECTS.flatMap(category => category.subjects)
  },
  {
    category: 'الهندسة',
    subjects: [
      { key: 'civil_engineer', name: 'الهندسة المدنية' },
      { key: 'mechanical_engineer', name: 'الهندسة الميكانيكية' },
      { key: 'electrical_engineer', name: 'الهندسة الكهربائية' },
      { key: 'software_engineer', name: 'هندسة البرمجيات' },
    ]
  },
  {
    category: 'العلوم الطبيعية',
    subjects: [
      { key: 'physicist', name: 'الفيزياء' },
      { key: 'chemist', name: 'الكيمياء' },
      { key: 'biologist', name: 'الأحياء (البيولوجيا)' },
      { key: 'astronomer', name: 'علم الفلك' },
      { key: 'geologist', name: 'الجيولوجيا' },
      { key: 'environmentalist', name: 'علوم البيئة' },
    ]
  },
  {
    category: 'الرياضيات',
    subjects: [
      { key: 'mathematician', name: 'الرياضيات' },
      { key: 'statistician', name: 'الإحصاء' },
    ]
  },
  {
    category: 'اللغات والآداب',
    subjects: [
      { key: 'arabic_teacher', name: 'اللغة العربية' },
      { key: 'english_teacher', name: 'اللغة الإنجليزية' },
      { key: 'french_teacher', name: 'اللغة الفرنسية' },
      { key: 'german_teacher', name: 'اللغة الألمانية' },
      { key: 'spanish_teacher', name: 'اللغة الإسبانية' },
      { key: 'literary_critic', name: 'الأدب والنقد' },
    ]
  },
  {
    category: 'العلوم الإنسانية والاجتماعية',
    subjects: [
      { key: 'historian', name: 'التاريخ' },
      { key: 'geographer', name: 'الجغرافيا' },
      { key: 'philosopher', name: 'الفلسفة' },
      { key: 'sociologist', name: 'علم الاجتماع' },
      { key: 'psychologist', name: 'علم النفس' },
      { key: 'economist', name: 'الاقتصاد' },
      { key: 'political_scientist', name: 'العلوم السياسية' },
    ]
  },
  {
    category: 'الفنون',
    subjects: [
      { key: 'art_historian', name: 'تاريخ الفن' },
      { key: 'music_theorist', name: 'الموسيقى' },
      { key: 'theater_critic', name: 'المسرح' },
      { key: 'photoshop_expert', name: 'خبير فوتوشوب' },
    ]
  }
];

// All non-programming academic subjects
export const ALL_ACADEMIC_SUBJECTS: Subject[] = SUBJECT_CATEGORIES.filter(c => c.category !== 'البرمجة وعلوم الكمبيوتر').flatMap(category => category.subjects);

// All programming subjects
export const ALL_PROGRAMMING_SUBJECTS: Subject[] = PROGRAMMING_SUBJECTS.flatMap(category => category.subjects);


export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface Analysis {
  type: 'tone_analysis';
  tone: string;
  suggestion: string;
  original_text: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  parts: Part[];
  action?: Action;
  analysis?: Analysis;
  groundingChunks?: GroundingChunk[];
  thinkingStep?: string;
  streamState?: 'streaming' | 'done';
  attachedFiles?: string[];
}

export interface MemoryFact {
  key: string;
  fact: string;
}

export interface ChatSession {
  id:string;
  title: string;
  messages: Message[];
  memory: MemoryFact[];
  lastModified: number;
}

export type VoiceState = 'idle' | 'listening' | 'wakeword' | 'processing';

export interface UserProfile {
  name: string;
  avatar: string; // base64
  userId: string;
}

export interface UserChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface RecentChat {
    partner: UserProfile;
    lastMessage: UserChatMessage;
}