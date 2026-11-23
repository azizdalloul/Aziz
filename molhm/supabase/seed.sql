-- بيانات اصطناعية/أساسية فقط — لا بيانات عملاء حقيقية.
insert into services (slug, title_ar, description_ar, sort) values
 ('personal-development','التطوير الشخصي','وضوح الهدف، بناء العادات، الثقة بالنفس، واتخاذ القرار.',1),
 ('romantic-relationships','العلاقات العاطفية','فهم أنماط التعلّق والتواصل وبناء علاقة أكثر وعياً.',2),
 ('marriage-understanding','التفاهم والزواج','تحسين الحوار والتفاهم بين الزوجين وإدارة الخلاف باحترام.',3),
 ('post-breakup','التعامل مع ما بعد الانفصال','مساحة منظّمة لإعادة ترتيب الأولويات واستعادة التوازن العملي.',4)
on conflict (slug) do nothing;

-- الأسعار المؤكدة فقط: المكتبية 60 دقيقة و90 دقيقة. الباقات والأسعار الأخرى غير منشورة حتى تُعتمد.
insert into plans (slug, kind, title_ar, description_ar, sessions, duration_minutes, price_qar, price_published, sort) values
 ('office-60','session','جلسة مكتبية — 60 دقيقة','جلسة وجاهية في المكتب.',1,60,1150,true,1),
 ('office-90','session','جلسة مكتبية — 90 دقيقة','جلسة وجاهية أطول لمعالجة أعمق.',1,90,1400,true,2),
 ('pkg-4','package','باقة 4 جلسات','',4,null,null,false,10),
 ('pkg-6','package','باقة 6 جلسات','',6,null,null,false,11),
 ('pkg-8','package','باقة 8 جلسات','',8,null,null,false,12),
 ('pkg-10','package','باقة 10 جلسات','',10,null,null,false,13)
on conflict (slug) do nothing;

-- أسئلة النموذج الأصلية (المنقولة من صور المالك). نص «قائمة الاختيار الإلزامية قبل مهنتك» غير معروف ولا يُخمَّن.
insert into form_questions (key, section, label_ar, helper_ar, type, required, origin, sort) values
 ('profession','بياناتك','مهنتك',null,'text',true,'original_form',10),
 ('country','بياناتك','البلد','أين تقيم الآن','text',true,'original_form',11),
 ('phone','بياناتك','رقم الهاتف','مع فتح الخط الدولي لنتمكن من الوصول إليك.','tel',true,'original_form',12),
 ('email','بياناتك','بريدك الإلكتروني',null,'email',true,'original_form',13),
 ('score_health','تقييم شخصي لك','الجانب الصحي',null,'scale10',true,'original_form',20),
 ('score_spiritual','تقييم شخصي لك','الحالة الروحانية',null,'scale10',true,'original_form',21),
 ('score_personal','تقييم شخصي لك','الجانب الشخصي',null,'scale10',true,'original_form',22),
 ('score_social','تقييم شخصي لك','العلاقات الاجتماعية والأسرة',null,'scale10',true,'original_form',23),
 ('score_career','تقييم شخصي لك','الجانب المهني',null,'scale10',true,'original_form',24),
 ('score_education','تقييم شخصي لك','الجانب التعليمي',null,'scale10',true,'original_form',25),
 ('score_leisure','تقييم شخصي لك','الجانب الترفيهي',null,'scale10',true,'original_form',26),
 ('extra_notes','ملاحظات','هل تود بإضافة ملاحظات/طلبات أخرى',null,'textarea',false,'original_form',30)
on conflict (key) do nothing;

-- بعد إنشاء مستخدمَين في Supabase Auth أضف ملفيهما:
-- insert into profiles (id, full_name, role) values ('<uuid-abdulaziz>','عبدالعزيز دلول','admin'), ('<uuid-heba>','هبة','operations');
