export const Colors = {
  // Primary palette - Deep Navy + Vibrant Coral
  primary: '#4F46E5',       // Indigo - main brand color
  primaryLight: '#818CF8',  // Light indigo
  primaryDark: '#3730A3',   // Dark indigo
  secondary: '#F97316',     // Orange - accent
  secondaryLight: '#FDBA74',

  // Semantic
  success: '#22C55E',
  successLight: '#86EFAC',
  error: '#EF4444',
  errorLight: '#FCA5A5',
  warning: '#F59E0B',
  warningLight: '#FCD34D',
  info: '#06B6D4',

  // Backgrounds
  background: '#0F172A',    // Dark navy
  backgroundSecondary: '#1E293B',
  backgroundCard: '#1E293B',
  backgroundInput: '#334155',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#334155',
  borderLight: '#475569',

  // Special
  gold: '#F59E0B',
  gradientStart: '#4F46E5',
  gradientEnd: '#7C3AED',
  gradientAccent: ['#4F46E5', '#7C3AED'] as const,

  // Mistake types
  grammar: '#EF4444',
  vocabulary: '#F97316',
  pronunciation: '#8B5CF6',
  spelling: '#06B6D4',
  other: '#64748B',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
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
  { id: 'culture', label: '文化', icon: '🎭', color: '#7C3AED' },
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

  // ── 文化・エンタメ ────────────────────────────────────────
  { id: 'movie_review',          label: '映画・ドラマについて語る',      icon: '🎬', color: '#7C3AED', parentTopic: 'culture',    hint: '感想・評価・おすすめの伝え方を練習しよう' },
  { id: 'food_culture',          label: '食文化を語る',                 icon: '🍜', color: '#D97706', parentTopic: 'culture',    hint: '料理の説明や好みの伝え方を練習しよう' },
  { id: 'local_festival',        label: '日本の祭り・行事を紹介',        icon: '🎉', color: '#DB2777', parentTopic: 'culture',    hint: '日本の文化をわかりやすく英語で説明しよう' },
  { id: 'music_talk',            label: '音楽の話で盛り上がる',          icon: '🎵', color: '#4F46E5', parentTopic: 'culture',    hint: '好きなジャンルやアーティストを英語で語ろう' },
  { id: 'anime_manga',           label: 'アニメ・マンガを紹介する',      icon: '🎌', color: '#EF4444', parentTopic: 'culture',    hint: '好きな作品のストーリーやキャラクターを英語で説明しよう' },
  { id: 'fashion_style',         label: 'ファッション・スタイルを語る',  icon: '👗', color: '#DB2777', parentTopic: 'culture',    hint: 'トレンドや自分のスタイルを英語でシェアしよう' },
  { id: 'art_museum',            label: '美術館・博物館での会話',        icon: '🖼️', color: '#7C3AED', parentTopic: 'culture',    hint: 'アート作品への感想や背景の話し方を練習しよう' },
  { id: 'new_year_customs',      label: '年末年始の風習を話す',          icon: '🎍', color: '#EF4444', parentTopic: 'culture',    hint: '日本独自のお正月文化を英語で楽しく伝えよう' },
  { id: 'social_media_trends',   label: 'SNSのトレンドを話す',           icon: '📱', color: '#06B6D4', parentTopic: 'culture',    hint: '最近バズっている話題を英語でシェアしよう' },
  { id: 'game_talk',             label: 'ゲームについて語る',            icon: '🎮', color: '#6366F1', parentTopic: 'culture',    hint: '好きなゲームの魅力を英語でプレゼンしよう' },
  { id: 'podcast_recommendation',label: 'ポッドキャスト・YouTubeをすすめる', icon: '🎙️', color: '#F59E0B', parentTopic: 'culture', hint: 'おすすめコンテンツを英語で紹介する練習をしよう' },

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
  { id: 'spring_sakura',         label: '桜・春の楽しみ方',             icon: '🌸', color: '#DB2777', parentTopic: 'culture',    hint: '花見の文化や春の風物詩を英語で紹介しよう' },
  { id: 'summer_vacation',       label: '夏休みの計画を話す',            icon: '🏖️', color: '#F59E0B', parentTopic: 'free',       hint: '夏のアクティビティや旅行計画を英語で語ろう' },
  { id: 'halloween_costume',     label: 'ハロウィーンの仮装・思い出',    icon: '🎃', color: '#F97316', parentTopic: 'culture',    hint: 'ハロウィーンの楽しみ方を英語でシェアしよう' },
  { id: 'christmas_plans',       label: 'クリスマスの過ごし方',          icon: '🎄', color: '#EF4444', parentTopic: 'culture',    hint: 'ホリデーシーズンの習慣を英語で話そう' },
  { id: 'birthday_celebration',  label: '誕生日パーティーの計画',        icon: '🎂', color: '#DB2777', parentTopic: 'free',       hint: 'サプライズやプレゼント選びを英語でプランしよう' },

  // ── 教育・学び ────────────────────────────────────────────
  { id: 'language_learning',     label: '語学学習の経験を話す',          icon: '🗣️', color: '#4F46E5', parentTopic: 'free',       hint: '英語学習の苦労ややりがいを英語でシェアしよう' },
  { id: 'school_memory',         label: '学校での思い出・先生',          icon: '🏫', color: '#0891B2', parentTopic: 'free',       hint: '印象に残った先生やエピソードを英語で話そう' },
  { id: 'online_course',         label: 'オンライン学習のすすめ',        icon: '🖥️', color: '#6366F1', parentTopic: 'free',       hint: 'おすすめの学習プラットフォームを英語で紹介しよう' },
  { id: 'science_curiosity',     label: '科学・宇宙の不思議を語る',      icon: '🔬', color: '#06B6D4', parentTopic: 'free',       hint: '興味ある科学トピックを英語でわかりやすく話そう' },
  { id: 'history_culture',       label: '歴史上の出来事・人物を語る',    icon: '🏛️', color: '#92400E', parentTopic: 'culture',    hint: '好きな歴史エピソードを英語でストーリーとして話そう' },

  // ── 人間関係・コミュニケーション ──────────────────────────
  { id: 'first_impression',      label: '第一印象・人の見た目を話す',    icon: '👀', color: '#F59E0B', parentTopic: 'free',       hint: '人の印象や特徴の英語表現を練習しよう' },
  { id: 'making_friends',        label: '友達作りのコツを語る',          icon: '😊', color: '#22C55E', parentTopic: 'free',       hint: '関係を築くための英語フレーズを練習しよう' },
  { id: 'conflict_resolution',   label: '誤解を解く・謝る',             icon: '🕊️', color: '#06B6D4', parentTopic: 'free',       hint: '穏やかに問題解決するための英語フレーズを練習しよう' },
  { id: 'compliment_giving',     label: '褒め言葉・感謝を伝える',        icon: '💝', color: '#DB2777', parentTopic: 'free',       hint: '心のこもった英語の褒め方・感謝の伝え方を練習しよう' },
  { id: 'debate_opinion',        label: 'ディスカッション・反論する',    icon: '⚡', color: '#EF4444', parentTopic: 'free',       hint: '自分の主張を論理的かつ丁寧に英語で述べよう' },
] as const;

export type DailyTopic = typeof DAILY_TOPICS[number];

/** 日付シードで今日のトピックを取得する */
export function getTodayTopic(): DailyTopic {
  const d = new Date();
  const seed =
    d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return DAILY_TOPICS[seed % DAILY_TOPICS.length];
}
