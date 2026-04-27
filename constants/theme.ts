export const Colors = {
  // Primary palette - Deep Violet / Purple
  primary: '#7C3AED',          // Vivid violet
  primaryLight: '#A78BFA',     // Soft violet
  primaryDark: '#5B21B6',      // Deep violet
  secondary: '#EC4899',        // Vibrant pink accent
  secondaryLight: '#F9A8D4',

  // Semantic
  success: '#10B981',
  successLight: '#6EE7B7',
  error: '#F43F5E',
  errorLight: '#FDA4AF',
  warning: '#F59E0B',
  warningLight: '#FCD34D',
  info: '#38BDF8',

  // Backgrounds - Deep dark with purple tint
  background: '#07071A',         // Near-black purple
  backgroundSecondary: '#0D0D26',
  backgroundCard: 'rgba(10,8,28,0.68)',        // Dark glass (写真背景対応)
  backgroundInput: 'rgba(10,8,28,0.75)',

  // Text
  textPrimary: '#F0EEFF',        // Slightly purple-tinted white
  textSecondary: '#9B9BC5',      // Muted purple-gray
  textMuted: '#5A5A80',
  textOnPrimary: '#FFFFFF',

  // Borders - glassmorphism style
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.14)',

  // Special
  gold: '#F59E0B',
  gradientStart: '#5B21B6',
  gradientEnd: '#7C3AED',
  gradientAccent: ['#5B21B6', '#7C3AED'] as const,

  // Glassmorphism helpers (写真背景対応: ダークガラス)
  glass: 'rgba(10,8,28,0.68)',
  glassBorder: 'rgba(255,255,255,0.16)',
  glassBorderStrong: 'rgba(255,255,255,0.26)',
  glassHighlight: 'rgba(255,255,255,0.10)',

  // Mistake types
  grammar: '#F43F5E',
  vocabulary: '#F97316',
  pronunciation: '#8B5CF6',
  spelling: '#38BDF8',
  other: '#5A5A80',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const AVATARS = [
  {
    id: 'emma',
    name: 'Emma',
    accent: 'American',
    description: 'NYC出身のフレンドリーな先生',
    emoji: '👩‍🏫',
    voice: 'nova',
    color: '#4F46E5',
  },
  {
    id: 'james',
    name: 'James',
    accent: 'British',
    description: 'ロンドン出身のビジネスプロ',
    emoji: '👨‍💼',
    voice: 'onyx',
    color: '#0891B2',
  },
  {
    id: 'lily',
    name: 'Lily',
    accent: 'Australian',
    description: 'シドニー出身の旅行好き',
    emoji: '🌺',
    voice: 'shimmer',
    color: '#059669',
  },
];

export const TOPICS = [
  { id: 'free', label: 'フリー会話', icon: '💬', color: '#4F46E5' },
  { id: 'daily_life', label: '日常生活', icon: '🏠', color: '#0891B2' },
  { id: 'travel', label: '旅行', icon: '✈️', color: '#059669' },
  { id: 'business', label: 'ビジネス', icon: '💼', color: '#D97706' },
  { id: 'school', label: '学校', icon: '🏫', color: '#7C3AED' },
  { id: 'hobby', label: '趣味', icon: '🎨', color: '#DB2777' },
];

/** 毎日ローテーションする「今日のトピック」候補 (100個) */
export const DAILY_TOPICS = [
  // ── 旅行 ────────────────────────────────────────────────
  { id: 'airport_checkin',       label: '空港でチェックイン',           icon: '🛫', color: '#059669', parentTopic: 'travel',     hint: '搭乗手続きや荷物預けのフレーズを練習しよう' },
  { id: 'hotel_stay',            label: 'ホテルのチェックイン',          icon: '🏨', color: '#0891B2', parentTopic: 'travel',     hint: 'ルームリクエストやアメニティの頼み方を練習しよう' },
  { id: 'taxi_ride',             label: 'タクシーで目的地へ',            icon: '🚕', color: '#7C3AED', parentTopic: 'travel',     hint: '行き先の告げ方や料金交渉のフレーズを練習しよう' },
  { id: 'sightseeing',           label: '観光スポットを巡る',            icon: '🗺️', color: '#059669', parentTopic: 'travel',     hint: '道案内を尋ねたり観光情報を得るフレーズを練習しよう' },
  { id: 'train_ticket',          label: '電車・バスの切符を買う',        icon: '🚉', color: '#0891B2', parentTopic: 'travel',     hint: '乗り換えや時刻表の尋ね方を練習しよう' },
  { id: 'local_market',          label: '現地の市場で買い物',            icon: '🛒', color: '#D97706', parentTopic: 'travel',     hint: '値段交渉や試食のお願いフレーズを練習しよう' },
  { id: 'tour_guide',            label: '観光ガイドに質問する',          icon: '🧭', color: '#059669', parentTopic: 'travel',     hint: 'ツアーの内容確認や追加情報の尋ね方を練習しよう' },
  { id: 'travel_insurance',      label: '旅行保険・緊急時の対応',        icon: '🆘', color: '#EF4444', parentTopic: 'travel',     hint: '紛失・盗難・病気など緊急英語フレーズを練習しよう' },
  { id: 'customs_declaration',   label: '入国審査・税関を通過する',      icon: '🛃', color: '#6366F1', parentTopic: 'travel',     hint: '滞在目的や所持品申告の英語を練習しよう' },
  { id: 'travel_recommendation', label: '旅行先を友人にすすめる',        icon: '✈️', color: '#059669', parentTopic: 'travel',     hint: 'その土地の魅力を英語で生き生きと伝えよう' },

  // ── 日常生活 ─────────────────────────────────────────────
  { id: 'morning_routine',       label: '朝のルーティンを話す',          icon: '☀️', color: '#F59E0B', parentTopic: 'daily_life',  hint: '毎日の習慣を英語で話せるようになろう' },
  { id: 'shopping_mall',         label: 'ショッピングで店員と話す',      icon: '🛍️', color: '#DB2777', parentTopic: 'daily_life',  hint: 'サイズ確認や値引き交渉のフレーズを練習しよう' },
  { id: 'doctor_visit',          label: '病院・薬局で症状を伝える',      icon: '🏥', color: '#EF4444', parentTopic: 'daily_life',  hint: '体の不調を英語で正確に伝える練習をしよう' },
  { id: 'bank_procedure',        label: '銀行・両替の手続き',            icon: '🏦', color: '#0891B2', parentTopic: 'daily_life',  hint: '口座開設や送金のフレーズを練習しよう' },
  { id: 'weather_smalltalk',     label: '天気の雑談',                   icon: '🌤️', color: '#06B6D4', parentTopic: 'daily_life',  hint: 'ネイティブらしい天気トークで会話を弾ませよう' },
  { id: 'asking_directions',     label: '道を尋ねる・案内する',          icon: '🗾', color: '#059669', parentTopic: 'daily_life',  hint: '地図なしで目的地に辿り着くフレーズを練習しよう' },
  { id: 'restaurant_order',      label: 'レストランで注文する',          icon: '🍽️', color: '#D97706', parentTopic: 'daily_life',  hint: '料理の注文や食物アレルギーの伝え方を練習しよう' },
  { id: 'cafe_order',            label: 'カフェでカスタム注文',          icon: '☕', color: '#92400E', parentTopic: 'daily_life',  hint: '飲み物の細かいカスタマイズを英語で伝えよう' },
  { id: 'post_office',           label: '郵便局・宅配で手続き',          icon: '📮', color: '#6366F1', parentTopic: 'daily_life',  hint: '荷物の送り方や追跡方法を英語で練習しよう' },
  { id: 'hair_salon',            label: '美容院・理髪店でオーダー',      icon: '💇', color: '#DB2777', parentTopic: 'daily_life',  hint: '希望のスタイルを英語で正確に伝えよう' },
  { id: 'gym_workout',           label: 'ジムでトレーナーに話しかける',  icon: '🏋️', color: '#22C55E', parentTopic: 'daily_life',  hint: 'マシンの使い方確認やアドバイス依頼を練習しよう' },
  { id: 'apartment_landlord',    label: '不動産・家主とやり取り',        icon: '🏠', color: '#0891B2', parentTopic: 'daily_life',  hint: '修理依頼や契約内容確認のフレーズを練習しよう' },
  { id: 'neighbor_chat',         label: '近所の人とのスモールトーク',    icon: '👋', color: '#F59E0B', parentTopic: 'daily_life',  hint: '挨拶から軽い会話に発展させるフレーズを練習しよう' },
  { id: 'pet_vet',               label: '動物病院で獣医と話す',          icon: '🐕', color: '#22C55E', parentTopic: 'daily_life',  hint: 'ペットの症状や治療内容を英語で説明しよう' },
  { id: 'library_visit',         label: '図書館・書店で本を探す',        icon: '📖', color: '#7C3AED', parentTopic: 'daily_life',  hint: 'スタッフへの質問やリクエストフレーズを練習しよう' },

  // ── ビジネス ─────────────────────────────────────────────
  { id: 'self_intro_biz',        label: 'ビジネス自己紹介',             icon: '🤝', color: '#D97706', parentTopic: 'business',   hint: '名刺交換やアイスブレークのフレーズを練習しよう' },
  { id: 'meeting_opinion',       label: '会議で意見を述べる',            icon: '💡', color: '#4F46E5', parentTopic: 'business',   hint: '提案・同意・反対の言い方を練習しよう' },
  { id: 'email_writing',         label: 'ビジネスメールの書き方',        icon: '📧', color: '#7C3AED', parentTopic: 'business',   hint: '件名・書き出し・結び言葉のパターンを練習しよう' },
  { id: 'phone_appointment',     label: '電話でアポを取る',              icon: '📞', color: '#059669', parentTopic: 'business',   hint: '日程調整や確認のフレーズを電話口で練習しよう' },
  { id: 'presentation',          label: 'プレゼンテーション',            icon: '📊', color: '#D97706', parentTopic: 'business',   hint: '導入・展開・まとめの英語フレームを練習しよう' },
  { id: 'negotiation',           label: '交渉・折衝',                   icon: '⚖️', color: '#EF4444', parentTopic: 'business',   hint: '条件提示・妥協・合意のフレーズを練習しよう' },
  { id: 'job_interview',         label: '就職・転職の面接',             icon: '👔', color: '#0891B2', parentTopic: 'business',   hint: '強みや経験を英語で魅力的にアピールしよう' },
  { id: 'client_meeting',        label: 'クライアントとの初対面',        icon: '🏢', color: '#D97706', parentTopic: 'business',   hint: '信頼関係を築く最初の挨拶フレーズを練習しよう' },
  { id: 'project_update',        label: 'プロジェクトの進捗報告',        icon: '📋', color: '#6366F1', parentTopic: 'business',   hint: '状況説明・課題共有・次のアクションを英語で話そう' },
  { id: 'complaint_handling',    label: 'クレーム対応・謝罪',            icon: '🙏', color: '#EF4444', parentTopic: 'business',   hint: '丁寧な謝罪と解決策の提示フレーズを練習しよう' },
  { id: 'remote_work_chat',      label: 'リモート会議でのやり取り',      icon: '💻', color: '#4F46E5', parentTopic: 'business',   hint: '音声トラブルや発言タイミングのフレーズを練習しよう' },
  { id: 'business_lunch',        label: 'ビジネスランチでの雑談',        icon: '🥗', color: '#22C55E', parentTopic: 'business',   hint: '仕事から離れた軽い会話で関係を深める練習をしよう' },
  { id: 'salary_negotiation',    label: '給与・待遇の交渉',             icon: '💰', color: '#F59E0B', parentTopic: 'business',   hint: '自分の価値を自信を持って英語で伝えよう' },
  { id: 'feedback_giving',       label: '部下・同僚へのフィードバック',  icon: '🌟', color: '#06B6D4', parentTopic: 'business',   hint: '建設的なフィードバックを優しく英語で伝えよう' },

  // ── 学校・教育 ────────────────────────────────────────────
  { id: 'favorite_subject',      label: '好きな科目・嫌いな科目',        icon: '📚', color: '#7C3AED', parentTopic: 'school',     hint: '授業への感想や理由を英語で説明しよう' },
  { id: 'memorable_teacher',     label: '印象に残った先生の話',          icon: '👨‍🏫', color: '#4F46E5', parentTopic: 'school',     hint: '先生の特徴やエピソードを英語で生き生きと話そう' },
  { id: 'school_lunch',          label: '給食・お弁当の思い出',          icon: '🍱', color: '#D97706', parentTopic: 'school',     hint: '食べ物の説明や学校のエピソードを英語で話そう' },
  { id: 'club_activities',       label: '部活・クラブ活動の話',          icon: '⚽', color: '#059669', parentTopic: 'school',     hint: '活動内容や思い出を英語でシェアしよう' },
  { id: 'exam_stress',           label: '試験・受験のプレッシャー',      icon: '📝', color: '#EF4444', parentTopic: 'school',     hint: '勉強法やストレス対処を英語で話そう' },
  { id: 'school_trip',           label: '修学旅行・校外学習の思い出',    icon: '🚌', color: '#0891B2', parentTopic: 'school',     hint: '旅のエピソードや友達との話を英語でしよう' },
  { id: 'school_festival',       label: '文化祭・体育祭の話',            icon: '🎪', color: '#DB2777', parentTopic: 'school',     hint: '準備や当日の様子を英語で盛り上がって話そう' },
  { id: 'school_rules',          label: '校則・制服について話す',        icon: '👔', color: '#6366F1', parentTopic: 'school',     hint: '自分の意見を英語でハッキリ述べる練習をしよう' },
  { id: 'study_methods',         label: '自分なりの勉強法を紹介',        icon: '🧠', color: '#7C3AED', parentTopic: 'school',     hint: '効率的な学習方法を英語でアドバイスしよう' },
  { id: 'school_friends',        label: '学校での友達・クラスメート',    icon: '👫', color: '#22C55E', parentTopic: 'school',     hint: '人の特徴や関係性を英語で説明しよう' },
  { id: 'embarrassing_school',   label: '学校でのハプニング・黒歴史',    icon: '😅', color: '#F59E0B', parentTopic: 'school',     hint: '笑えるエピソードを英語でユーモラスに話そう' },
  { id: 'after_school',          label: '放課後の過ごし方',              icon: '🌆', color: '#0891B2', parentTopic: 'school',     hint: '日常のルーティンを英語でテンポよく話そう' },
  { id: 'student_council',       label: '生徒会・委員会・クラス委員',    icon: '🏅', color: '#D97706', parentTopic: 'school',     hint: '役割の説明や経験談を英語でシェアしよう' },
  { id: 'school_impact',         label: '学校生活が今の自分に与えた影響', icon: '⭐', color: '#4F46E5', parentTopic: 'school',     hint: '自己分析を英語で深く語る練習をしよう' },
  { id: 'ideal_school',          label: 'こんな学校があったらいいな',    icon: '🏫', color: '#7C3AED', parentTopic: 'school',     hint: '理想を英語でクリエイティブに語ろう' },

  // ── 文化・エンタメ（hobbyに再分類）────────────────────────
  { id: 'movie_review',          label: '映画・ドラマについて語る',      icon: '🎬', color: '#DB2777', parentTopic: 'hobby',      hint: '感想・評価・おすすめの伝え方を練習しよう' },
  { id: 'food_culture',          label: '食文化を語る',                 icon: '🍜', color: '#D97706', parentTopic: 'daily_life', hint: '料理の説明や好みの伝え方を練習しよう' },
  { id: 'local_festival',        label: '日本の祭り・行事を紹介',        icon: '🎉', color: '#DB2777', parentTopic: 'daily_life', hint: '日本の文化をわかりやすく英語で説明しよう' },
  { id: 'music_talk',            label: '音楽の話で盛り上がる',          icon: '🎵', color: '#4F46E5', parentTopic: 'hobby',      hint: '好きなジャンルやアーティストを英語で語ろう' },
  { id: 'anime_manga',           label: 'アニメ・マンガを紹介する',      icon: '🎌', color: '#EF4444', parentTopic: 'hobby',      hint: '好きな作品のストーリーやキャラクターを英語で説明しよう' },
  { id: 'fashion_style',         label: 'ファッション・スタイルを語る',  icon: '👗', color: '#DB2777', parentTopic: 'hobby',      hint: 'トレンドや自分のスタイルを英語でシェアしよう' },
  { id: 'art_museum',            label: '美術館・博物館での会話',        icon: '🖼️', color: '#7C3AED', parentTopic: 'free',       hint: 'アート作品への感想や背景の話し方を練習しよう' },
  { id: 'new_year_customs',      label: '年末年始の風習を話す',          icon: '🎍', color: '#EF4444', parentTopic: 'daily_life', hint: '日本独自のお正月文化を英語で楽しく伝えよう' },
  { id: 'social_media_trends',   label: 'SNSのトレンドを話す',           icon: '📱', color: '#06B6D4', parentTopic: 'free',       hint: '最近バズっている話題を英語でシェアしよう' },
  { id: 'game_talk',             label: 'ゲームについて語る',            icon: '🎮', color: '#6366F1', parentTopic: 'hobby',      hint: '好きなゲームの魅力を英語でプレゼンしよう' },
  { id: 'podcast_recommendation',label: 'ポッドキャスト・YouTubeをすすめる', icon: '🎙️', color: '#F59E0B', parentTopic: 'hobby',  hint: 'おすすめコンテンツを英語で紹介する練習をしよう' },

  // ── 趣味・アクティビティ ──────────────────────────────────
  { id: 'cooking_recipe',        label: '料理レシピを紹介する',          icon: '👨‍🍳', color: '#F59E0B', parentTopic: 'hobby',      hint: '材料・手順をシンプルな英語で説明しよう' },
  { id: 'travel_planning',       label: '旅行プランを立てる',            icon: '🌍', color: '#059669', parentTopic: 'hobby',      hint: '行きたい場所・やりたいことを英語で話そう' },
  { id: 'weekend_plans',         label: '週末の予定を話す',              icon: '🎡', color: '#DB2777', parentTopic: 'hobby',      hint: '予定・誘い・断り方のフレーズを練習しよう' },
  { id: 'book_recommendation',   label: '本・マンガをすすめる',          icon: '📚', color: '#7C3AED', parentTopic: 'hobby',      hint: 'あらすじを簡単に説明する英語力を鍛えよう' },
  { id: 'fitness_health',        label: '健康・フィットネスの話',        icon: '💪', color: '#22C55E', parentTopic: 'hobby',      hint: '運動習慣や食生活を英語でシェアしよう' },
  { id: 'pet_talk',              label: 'ペットの自慢話',                icon: '🐾', color: '#F59E0B', parentTopic: 'daily_life',  hint: '動物の特徴や可愛いエピソードを英語で話そう' },
  { id: 'sports_talk',           label: 'スポーツ観戦トーク',            icon: '⚽', color: '#059669', parentTopic: 'hobby',      hint: '試合の感想や選手の話を英語で盛り上げよう' },
  { id: 'hiking_nature',         label: 'ハイキング・アウトドアの話',    icon: '🏔️', color: '#059669', parentTopic: 'hobby',      hint: '自然の景色や体験を英語で生き生きと伝えよう' },
  { id: 'photography',           label: '写真撮影の趣味を語る',          icon: '📷', color: '#6366F1', parentTopic: 'hobby',      hint: '撮影のこだわりや機材の話を英語でシェアしよう' },
  { id: 'diy_craft',             label: 'DIY・ハンドメイドの話',         icon: '🔨', color: '#92400E', parentTopic: 'hobby',      hint: '作り方の説明や完成品自慢を英語でしよう' },
  { id: 'gardening',             label: 'ガーデニング・植物の話',        icon: '🌱', color: '#22C55E', parentTopic: 'hobby',      hint: '植物のケア方法や育てる喜びを英語で話そう' },
  { id: 'wine_coffee',           label: 'ワイン・コーヒーを語る',        icon: '🍷', color: '#DB2777', parentTopic: 'hobby',      hint: '味の描写や好みを英語で表現する練習をしよう' },
  { id: 'yoga_meditation',       label: 'ヨガ・瞑想の話',               icon: '🧘', color: '#7C3AED', parentTopic: 'hobby',      hint: '心身の健康について英語でゆったり話そう' },
  { id: 'cycling',               label: 'サイクリングの話',             icon: '🚴', color: '#06B6D4', parentTopic: 'hobby',      hint: 'コースや装備について英語で語ろう' },
  { id: 'dance',                 label: 'ダンス・音楽のパフォーマンス',  icon: '💃', color: '#DB2777', parentTopic: 'hobby',      hint: '好きなダンスジャンルや体験を英語でシェアしよう' },

  // ── フリー・自己表現 ─────────────────────────────────────
  { id: 'childhood_memory',      label: '子どもの頃の思い出',            icon: '🧸', color: '#06B6D4', parentTopic: 'free',       hint: '過去形を使って懐かしい話を英語でしよう' },
  { id: 'dream_job',             label: '夢の仕事について語る',          icon: '🚀', color: '#4F46E5', parentTopic: 'free',       hint: '将来の夢や理想のキャリアを英語で表現しよう' },
  { id: 'current_events',        label: '最近の出来事を話す',            icon: '📰', color: '#64748B', parentTopic: 'free',       hint: 'ニュースや身近な出来事を英語でシェアしよう' },
  { id: 'bucket_list',           label: 'バケットリストを語る',          icon: '📝', color: '#F59E0B', parentTopic: 'free',       hint: 'やってみたいことを英語でワクワク話そう' },
  { id: 'personality_values',    label: '自分の価値観・性格を話す',      icon: '🔮', color: '#7C3AED', parentTopic: 'free',       hint: '自己分析をもとに英語で自分を表現しよう' },
  { id: 'embarrassing_story',    label: '恥ずかしい・面白いエピソード',  icon: '😂', color: '#EF4444', parentTopic: 'free',       hint: '笑える体験談を英語でユーモラスに話そう' },
  { id: 'life_changing_moment',  label: '人生を変えた出来事',            icon: '⭐', color: '#F59E0B', parentTopic: 'free',       hint: '転機となった体験を英語で感情込めて話そう' },
  { id: 'if_i_could',            label: 'もし〇〇できたら話',            icon: '🌈', color: '#06B6D4', parentTopic: 'free',       hint: '仮定法を使った夢のある会話を練習しよう' },
  { id: 'advice_giving',         label: '人生のアドバイスを語る',        icon: '🧠', color: '#4F46E5', parentTopic: 'free',       hint: '経験から学んだ知恵を英語で伝えよう' },
  { id: 'describe_hometown',     label: '地元・生まれ育った街を紹介',    icon: '🏙️', color: '#0891B2', parentTopic: 'free',       hint: '地元の魅力を英語でアピールしよう' },

  // ── 社会・テクノロジー ────────────────────────────────────
  { id: 'ai_technology',         label: 'AI・最新テクノロジーの話',      icon: '🤖', color: '#6366F1', parentTopic: 'free',       hint: 'テクノロジーへの意見や期待を英語で語ろう' },
  { id: 'environment_climate',   label: '環境問題・気候変動を話す',      icon: '🌍', color: '#22C55E', parentTopic: 'free',       hint: '環境への取り組みや意見を英語で伝えよう' },
  { id: 'social_issue',          label: '社会問題について意見を言う',    icon: '🗣️', color: '#EF4444', parentTopic: 'free',       hint: '自分の意見を英語で論理的に述べる練習をしよう' },
  { id: 'future_of_work',        label: '働き方の未来について語る',      icon: '🔭', color: '#4F46E5', parentTopic: 'business',   hint: 'リモートワークやAI時代の働き方を英語で議論しよう' },
  { id: 'study_habits',          label: '学習方法・勉強習慣を話す',      icon: '📐', color: '#0891B2', parentTopic: 'free',       hint: '自分の学習法を英語でシェアして語彙力もアップ' },
  { id: 'money_finance',         label: 'お金の使い方・節約術',          icon: '💳', color: '#22C55E', parentTopic: 'free',       hint: 'お金に関する英語の表現やスラングを練習しよう' },

  // ── 季節・特別な日 ────────────────────────────────────────
  { id: 'spring_sakura',         label: '桜・春の楽しみ方',             icon: '🌸', color: '#DB2777', parentTopic: 'daily_life', hint: '花見の文化や春の風物詩を英語で紹介しよう' },
  { id: 'summer_vacation',       label: '夏休みの計画を話す',            icon: '🏖️', color: '#F59E0B', parentTopic: 'free',       hint: '夏のアクティビティや旅行計画を英語で語ろう' },
  { id: 'halloween_costume',     label: 'ハロウィーンの仮装・思い出',    icon: '🎃', color: '#F97316', parentTopic: 'daily_life', hint: 'ハロウィーンの楽しみ方を英語でシェアしよう' },
  { id: 'christmas_plans',       label: 'クリスマスの過ごし方',          icon: '🎄', color: '#EF4444', parentTopic: 'daily_life', hint: 'ホリデーシーズンの習慣を英語で話そう' },
  { id: 'birthday_celebration',  label: '誕生日パーティーの計画',        icon: '🎂', color: '#DB2777', parentTopic: 'free',       hint: 'サプライズやプレゼント選びを英語でプランしよう' },

  // ── 教育・学び ────────────────────────────────────────────
  { id: 'language_learning',     label: '語学学習の経験を話す',          icon: '🗣️', color: '#4F46E5', parentTopic: 'free',       hint: '英語学習の苦労ややりがいを英語でシェアしよう' },
  { id: 'school_memory',         label: '学校での思い出・先生',          icon: '🏫', color: '#0891B2', parentTopic: 'free',       hint: '印象に残った先生やエピソードを英語で話そう' },
  { id: 'online_course',         label: 'オンライン学習のすすめ',        icon: '🖥️', color: '#6366F1', parentTopic: 'free',       hint: 'おすすめの学習プラットフォームを英語で紹介しよう' },
  { id: 'science_curiosity',     label: '科学・宇宙の不思議を語る',      icon: '🔬', color: '#06B6D4', parentTopic: 'free',       hint: '興味ある科学トピックを英語でわかりやすく話そう' },
  { id: 'history_culture',       label: '歴史上の出来事・人物を語る',    icon: '🏛️', color: '#92400E', parentTopic: 'school',     hint: '好きな歴史エピソードを英語でストーリーとして話そう' },

  // ── 人間関係・コミュニケーション ──────────────────────────
  { id: 'first_impression',      label: '第一印象・人の見た目を話す',    icon: '👀', color: '#F59E0B', parentTopic: 'free',       hint: '人の印象や特徴の英語表現を練習しよう' },
  { id: 'making_friends',        label: '友達作りのコツを語る',          icon: '😊', color: '#22C55E', parentTopic: 'free',       hint: '関係を築くための英語フレーズを練習しよう' },
  { id: 'conflict_resolution',   label: '誤解を解く・謝る',             icon: '🕊️', color: '#06B6D4', parentTopic: 'free',       hint: '穏やかに問題解決するための英語フレーズを練習しよう' },
  { id: 'compliment_giving',     label: '褒め言葉・感謝を伝える',        icon: '💝', color: '#DB2777', parentTopic: 'free',       hint: '心のこもった英語の褒め方・感謝の伝え方を練習しよう' },
  { id: 'debate_opinion',        label: 'ディスカッション・反論する',    icon: '⚡', color: '#EF4444', parentTopic: 'free',       hint: '自分の主張を論理的かつ丁寧に英語で述べよう' },

  // ── 旅行（追加）────────────────────────────────────────────
  { id: 'road_trip_plan',        label: 'ドライブ旅行のプランを立てる',  icon: '🚗', color: '#059669', parentTopic: 'travel',     hint: 'ルートや寄り道スポットを英語でプランしよう' },
  { id: 'travel_packing',        label: '旅行の荷造りこだわりを話す',    icon: '🧳', color: '#7C3AED', parentTopic: 'travel',     hint: '必需品リストや失敗談を英語で話そう' },
  { id: 'solo_travel',           label: '一人旅の魅力・不安を話す',      icon: '🗺️', color: '#0891B2', parentTopic: 'travel',     hint: '一人旅のメリット・デメリットを英語で語ろう' },
  { id: 'backpacking',           label: 'バックパック旅行の体験談',      icon: '🎒', color: '#059669', parentTopic: 'travel',     hint: '格安旅行のコツや思い出を英語でシェアしよう' },
  { id: 'language_barrier',      label: '言葉の壁を乗り越えた話',        icon: '🌐', color: '#6366F1', parentTopic: 'travel',     hint: 'ジェスチャーや英語での切り抜け方を練習しよう' },
  { id: 'domestic_travel',       label: '国内旅行のおすすめを紹介',      icon: '🗾', color: '#D97706', parentTopic: 'travel',     hint: '自分の地元や好きな場所を英語で熱く語ろう' },
  { id: 'travel_food',           label: '旅先で食べたもの・食文化',      icon: '🍱', color: '#F59E0B', parentTopic: 'travel',     hint: '料理の描写フレーズを旅行の話で練習しよう' },
  { id: 'cultural_shock',        label: '文化の違いに驚いた話',          icon: '😮', color: '#EF4444', parentTopic: 'travel',     hint: '海外で驚いた体験を英語でユーモラスに語ろう' },
  { id: 'travel_regret',         label: '買えばよかったお土産・後悔',    icon: '😅', color: '#92400E', parentTopic: 'travel',     hint: '後悔の表現や仮定法を旅行の文脈で練習しよう' },
  { id: 'dream_cruise',          label: 'クルーズ旅行・豪華旅の夢',      icon: '🚢', color: '#0891B2', parentTopic: 'travel',     hint: '夢の旅プランを英語で熱く語ろう' },

  // ── 日常生活（追加）───────────────────────────────────────
  { id: 'morning_coffee_shop',   label: 'いつものカフェを英語で注文',    icon: '☕', color: '#92400E', parentTopic: 'daily_life',  hint: 'カスタムオーダーを英語でスラスラ言えるようにしよう' },
  { id: 'supermarket_english',   label: 'スーパーでの英語コミュニケーション', icon: '🛒', color: '#22C55E', parentTopic: 'daily_life', hint: '商品の場所を聞いたり値段を確認する英語を練習しよう' },
  { id: 'apartment_trouble',     label: 'アパートのトラブルを管理人に報告', icon: '🏠', color: '#EF4444', parentTopic: 'daily_life', hint: '設備の不具合や困りごとを英語で伝える練習をしよう' },
  { id: 'phone_call_english',    label: '電話で予約・問い合わせをする',  icon: '📞', color: '#4F46E5', parentTopic: 'daily_life',  hint: '電話越しの英語特有の表現を練習しよう' },
  { id: 'weekend_errands',       label: '休日の用事・お出かけを話す',    icon: '🚶', color: '#06B6D4', parentTopic: 'daily_life',  hint: '予定や行動を英語でテンポよく話す練習をしよう' },
  { id: 'home_cooking_recipe',   label: '自炊レシピを英語で説明する',    icon: '👨‍🍳', color: '#D97706', parentTopic: 'daily_life',  hint: '手順や材料の言い方を英語でマスターしよう' },
  { id: 'laundry_cleaning',      label: '洗濯・掃除のこだわりを話す',    icon: '🧹', color: '#0891B2', parentTopic: 'daily_life',  hint: '日常動詞や頻度表現を家事の話で練習しよう' },
  { id: 'convenience_store',     label: 'コンビニ活用術を語る',          icon: '🏪', color: '#F59E0B', parentTopic: 'daily_life',  hint: 'コンビニ文化を英語で面白く紹介しよう' },
  { id: 'public_bath_onsen',     label: '銭湯・温泉について話す',        icon: '♨️', color: '#EF4444', parentTopic: 'daily_life',  hint: 'お風呂文化の独自性を英語で説明しよう' },
  { id: 'recycling_habits',      label: 'ゴミ分別・エコ習慣を話す',      icon: '♻️', color: '#22C55E', parentTopic: 'daily_life',  hint: '環境への取り組みを英語で具体的に説明しよう' },

  // ── ビジネス（追加）───────────────────────────────────────
  { id: 'startup_idea',          label: 'スタートアップのアイデアを話す', icon: '💡', color: '#F59E0B', parentTopic: 'business',   hint: 'ビジネスアイデアを英語でピッチする練習をしよう' },
  { id: 'work_from_cafe',        label: 'カフェ・コワーキングで仕事',    icon: '💻', color: '#7C3AED', parentTopic: 'business',   hint: '場所や環境についての英語表現を練習しよう' },
  { id: 'side_hustle',           label: '副業・フリーランスの話',        icon: '⚡', color: '#059669', parentTopic: 'business',   hint: '複数の収入源について英語で話す練習をしよう' },
  { id: 'annual_review',         label: '年度評価・キャリアを振り返る',  icon: '📊', color: '#4F46E5', parentTopic: 'business',   hint: '成果や目標を英語で論理的に伝えよう' },
  { id: 'difficult_coworker',    label: '苦手な同僚とうまくやる話',      icon: '🤝', color: '#EF4444', parentTopic: 'business',   hint: '職場の人間関係を英語で外交的に話そう' },
  { id: 'industry_trend',        label: '業界の最新トレンドを語る',      icon: '📈', color: '#06B6D4', parentTopic: 'business',   hint: '変化や動向を英語で分析的に伝えよう' },
  { id: 'work_overseas',         label: '海外で働く夢・経験を話す',      icon: '🌐', color: '#D97706', parentTopic: 'business',   hint: '国際的なキャリアへの意見を英語で語ろう' },
  { id: 'morning_routine_work',  label: '仕事前の朝ルーティンを話す',    icon: '☀️', color: '#F59E0B', parentTopic: 'business',   hint: '生産性を高める習慣を英語でシェアしよう' },
  { id: 'mentoring',             label: 'メンター・メンティーの関係',    icon: '🌟', color: '#7C3AED', parentTopic: 'business',   hint: '学ぶ姿勢や教える喜びを英語で表現しよう' },
  { id: 'ai_tools_at_work',      label: 'AI・ツールで仕事を効率化',      icon: '🤖', color: '#6366F1', parentTopic: 'business',   hint: '実際に使っているツールを英語で紹介しよう' },

  // ── 学校・大学（追加）──────────────────────────────────────
  { id: 'university_campus',     label: 'キャンパスライフを話す',        icon: '🎓', color: '#4F46E5', parentTopic: 'school',     hint: '大学生活の魅力を英語で生き生きと語ろう' },
  { id: 'choosing_major',        label: '学部・専攻の選び方を話す',      icon: '🔬', color: '#7C3AED', parentTopic: 'school',     hint: '進路選択の理由や迷いを英語で率直に話そう' },
  { id: 'seminar_research',      label: 'ゼミ・研究室の話をする',        icon: '📋', color: '#059669', parentTopic: 'school',     hint: '研究内容や発表準備を英語で説明しよう' },
  { id: 'all_nighter',           label: '徹夜でレポートを仕上げる',      icon: '🌙', color: '#6366F1', parentTopic: 'school',     hint: '深夜の奮闘体験を英語でユーモラスに語ろう' },
  { id: 'part_time_job',         label: 'アルバイトの経験を話す',        icon: '💰', color: '#D97706', parentTopic: 'school',     hint: '仕事の体験談やお客様とのやり取りを英語で話そう' },
  { id: 'circle_club_uni',       label: '大学サークルへの勧誘を断る',    icon: '🎪', color: '#EF4444', parentTopic: 'school',     hint: '丁重に断る・受け入れるフレーズを練習しよう' },
  { id: 'professor_office_hour', label: '教授にアポを取り相談する',      icon: '👨‍🏫', color: '#0891B2', parentTopic: 'school',     hint: '敬語・丁寧表現の英語でアポ取りを練習しよう' },
  { id: 'living_alone_uni',      label: '初めての一人暮らしを話す',      icon: '🏠', color: '#22C55E', parentTopic: 'school',     hint: '自立した生活の大変さや楽しさを英語で語ろう' },
  { id: 'internship_experience', label: 'インターンシップの体験談',      icon: '💼', color: '#F59E0B', parentTopic: 'school',     hint: '職場での学びや驚きを英語でシェアしよう' },
  { id: 'graduation_thesis',     label: '卒論・卒業研究の話をする',      icon: '📝', color: '#7C3AED', parentTopic: 'school',     hint: '研究テーマや苦労を英語で説明しよう' },
  { id: 'study_abroad_dream',    label: '留学したい・した経験を話す',    icon: '✈️', color: '#059669', parentTopic: 'school',     hint: '留学への期待や不安を英語で率直に語ろう' },
  { id: 'uni_cafeteria',         label: '大学の学食・食堂を紹介',        icon: '🍜', color: '#D97706', parentTopic: 'school',     hint: 'お気に入りメニューやオススメを英語で語ろう' },
  { id: 'exam_cramming',         label: 'テスト前日の詰め込み作戦',      icon: '😰', color: '#EF4444', parentTopic: 'school',     hint: '勉強法や焦りの表現を英語でリアルに話そう' },
  { id: 'student_budget',        label: '学生のお金管理・節約術',        icon: '💳', color: '#22C55E', parentTopic: 'school',     hint: '限られた予算でのやりくりを英語で話そう' },
  { id: 'job_hunting_katsu',     label: '就活・自己PRの練習をする',      icon: '👔', color: '#4F46E5', parentTopic: 'school',     hint: '志望動機や強みを英語でアピールする練習をしよう' },
  { id: 'class_group_work',      label: 'グループワーク・発表の準備',    icon: '👥', color: '#06B6D4', parentTopic: 'school',     hint: '役割分担や意見まとめのフレーズを練習しよう' },
  { id: 'uni_festival',          label: '学園祭の出し物・準備を話す',    icon: '🎉', color: '#DB2777', parentTopic: 'school',     hint: '企画や役割について英語で話す練習をしよう' },
  { id: 'roommate_shareroom',    label: 'シェアハウス・ルームメートの話', icon: '🏡', color: '#F97316', parentTopic: 'school',     hint: '共同生活のルールや体験を英語で話そう' },
  { id: 'online_lecture',        label: 'オンライン授業の感想を話す',    icon: '💻', color: '#6366F1', parentTopic: 'school',     hint: 'リモート学習のメリット・デメリットを英語で語ろう' },
  { id: 'entrance_exam_story',   label: '受験・試験勉強の苦労話',        icon: '📚', color: '#0891B2', parentTopic: 'school',     hint: '過去の努力や戦略を英語でドラマチックに語ろう' },

  // ── 趣味（追加）───────────────────────────────────────────
  { id: 'live_concert',          label: 'ライブ・コンサートの体験談',    icon: '🎤', color: '#DB2777', parentTopic: 'hobby',      hint: '興奮した体験を英語で臨場感たっぷりに語ろう' },
  { id: 'streaming_binge',       label: '一気見したドラマ・アニメ',      icon: '📺', color: '#4F46E5', parentTopic: 'hobby',      hint: 'あらすじや感想を英語でテンポよく話そう' },
  { id: 'board_game_night',      label: 'ゲームナイト・ボドゲを語る',    icon: '🎲', color: '#059669', parentTopic: 'hobby',      hint: 'ルール説明や白熱した展開を英語で話そう' },
  { id: 'running_marathon',      label: 'ランニング・マラソンの話',      icon: '🏃', color: '#22C55E', parentTopic: 'hobby',      hint: '目標や練習方法を英語でシェアしよう' },
  { id: 'manga_collection',      label: 'マンガ・コレクションを紹介',    icon: '📖', color: '#EF4444', parentTopic: 'hobby',      hint: 'お気に入り作品の魅力を英語で語ろう' },
  { id: 'street_food_tour',      label: '食べ歩き・グルメ探検を話す',    icon: '🍡', color: '#F97316', parentTopic: 'hobby',      hint: '食の感動を英語で美味しそうに表現しよう' },
  { id: 'esports',               label: 'eスポーツ・ゲーム大会の話',     icon: '🎮', color: '#7C3AED', parentTopic: 'hobby',      hint: '競技ゲームの熱狂を英語で語ろう' },
  { id: 'karaoke_night',         label: 'カラオケの十八番を語る',        icon: '🎵', color: '#DB2777', parentTopic: 'hobby',      hint: '好きな曲や歌う楽しさを英語でシェアしよう' },
  { id: 'escape_room',           label: '謎解き・脱出ゲームの体験',      icon: '🔐', color: '#F59E0B', parentTopic: 'hobby',      hint: '体験の描写や推理を英語で話す練習をしよう' },
  { id: 'crafting_handmade',     label: 'ハンドメイド・クラフト作品紹介', icon: '🎨', color: '#06B6D4', parentTopic: 'hobby',      hint: '作り方や材料を英語でわかりやすく説明しよう' },
  { id: 'vintage_thrift',        label: '古着・ヴィンテージショップ巡り', icon: '👗', color: '#92400E', parentTopic: 'hobby',      hint: '掘り出し物の喜びを英語でシェアしよう' },
  { id: 'stargazing',            label: '星空・天文観測の話',            icon: '🔭', color: '#6366F1', parentTopic: 'hobby',      hint: '宇宙への興味や体験を英語でロマンチックに語ろう' },

  // ── フリー・自己表現（追加）────────────────────────────────
  { id: 'lottery_dream',         label: '宝くじが当たったら何をする？',  icon: '💰', color: '#F59E0B', parentTopic: 'free',       hint: '仮定法を使って夢のある会話を楽しもう' },
  { id: 'time_travel',           label: 'タイムトラベルするなら何時代？', icon: '⏰', color: '#7C3AED', parentTopic: 'free',       hint: '歴史の知識を英語でロマンチックに語ろう' },
  { id: 'superpower_choice',     label: '欲しい超能力を語る',            icon: '⚡', color: '#4F46E5', parentTopic: 'free',       hint: '仮定法と創造的な発想を英語で表現しよう' },
  { id: 'spirit_animal',         label: '自分を動物に例えると何？',      icon: '🦊', color: '#F97316', parentTopic: 'free',       hint: '自己表現の英語フレーズをユーモラスに練習しよう' },
  { id: 'overrated_things',      label: '過大評価・過小評価なものを語る', icon: '🤔', color: '#64748B', parentTopic: 'free',       hint: '批評・意見を英語で論理的かつ面白く伝えよう' },
  { id: 'perfect_sunday',        label: '理想の日曜日はどんな感じ？',    icon: '🌅', color: '#06B6D4', parentTopic: 'free',       hint: '好みや理想を英語でリラックスして話そう' },
  { id: 'life_chapter_title',    label: '今の人生の章にタイトルをつける', icon: '📖', color: '#DB2777', parentTopic: 'free',       hint: '比喩表現を使った英語の自己表現を練習しよう' },
  { id: 'swap_lives',            label: '1週間だけ誰かと人生を交換',     icon: '🔄', color: '#22C55E', parentTopic: 'free',       hint: '理由を英語で説得力を持って語ろう' },
  { id: 'redesign_society',      label: '社会のここを変えたいと思うこと', icon: '🌍', color: '#EF4444', parentTopic: 'free',       hint: '社会問題への意見を英語で建設的に語ろう' },
  { id: 'small_gratitude',       label: '日常の小さな幸せを語る',        icon: '🌸', color: '#DB2777', parentTopic: 'free',       hint: '感謝の表現や肯定的フレーズを英語で練習しよう' },
] as const;

export type DailyTopic = typeof DAILY_TOPICS[number];

/** 日付シードで今日のトピックを取得する */
export function getTodayTopic(): DailyTopic {
  const d = new Date();
  const seed =
    d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return DAILY_TOPICS[seed % DAILY_TOPICS.length];
}
