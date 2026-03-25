import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDkaXEX1UCe7JI6YGSwKSUwhlhicMWKduk",
    authDomain: "fitgirls-me-web.firebaseapp.com",
    projectId: "fitgirls-me-web",
    storageBucket: "fitgirls-me-web.firebasestorage.app",
    messagingSenderId: "997964786089",
    appId: "1:997964786089:web:72eaba535985f0c8a2fcb8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 앞에서 20개 리뷰 번역 데이터 (naver-1 ~ naver-20)
const translations = {
    "naver-1": {
        en: { text: "It was my first body profile shoot, and the photographer handled everything perfectly. Even though I wasn't fully prepared with outfits and poses, the photographer guided me right away. I was extremely satisfied! I plan to visit again after I've shaped my body even better! There are so many props and outfits, and the attention to detail is amazing, so I'll definitely be back!" },
        ja: { text: "初めてのボディプロフィール撮影でしたが、さすが評判通り、カメラマンさんがテキパキと進めてくれました。衣装やポーズを完璧に準備できていない状態でしたが、カメラマンさんが見るなりすぐにアドバイスをくださり、とても満足のいく撮影ができました！次回、もっと体を仕上げてからまた訪問する予定です！小道具や衣装も非常に豊富で、ディテールまでしっかり見てくださるので間違いなくリピートします！" },
        zh: { text: "这是我第一次拍摄身材写真，摄影师果然名不虚传，帮我把一切都安排得妥妥当当。我对服装和姿势都没有充分准备，但摄影师一见到我就立刻给出了建议，我非常满意！打算把身材练得更好后再来！道具和服装非常丰富，连细节都照顾得很到位，绝对会再来！" }
    },
    "naver-2": {
        en: { text: "Above all, the photographer is so kind and wonderful!! I was very nervous going in, but he directed me so kindly and found the best angles and compositions that flattered me, so I was moved throughout the entire shoot ❤️ I shot in such a comfortable, fun atmosphere, just like visiting a friend's house!! 😊" },
        ja: { text: "何より、カメラマンさんがとても親切で素晴らしいんです！！すごく緊張して行ったのですが、優しくディレクションしてくださり、私が一番綺麗に映る角度や構図を上手く捉えてくださって、撮影中ずっと感動しっぱなしでした ❤️ まるで友だちの家に遊びに行ったような、リラックスした雰囲気で楽しく撮影できました！！😊" },
        zh: { text: "最重要的是，摄影师太亲切、太棒了！！去的时候非常紧张，但他亲切地指导我，帮我找到了最美的角度和构图，整个拍摄过程中我都深深感动 ❤️ 在轻松愉快的氛围中完成了拍摄，就像去朋友家玩一样！！😊" }
    },
    "naver-3": {
        en: { text: "It was my first ever body profile and unlike what I worried about, the shoot was so comfortable. The photographer told me how to pose and express myself well so that even the unretouched shots all came out great — it was hard to choose! I think I'll keep shooting at Fitgirls. The photographer is truly a master!!!" },
        ja: { text: "人生初のボディプロフィールでしたが、心配していたのとは打って変わって、とてもリラックスして撮影できました。ポーズや表情を丁寧に教えてくださったおかげで、無加工の写真も全部気に入って選ぶのが大変でしたㅠㅠ 次もFitgirlsで撮影すると思います。フォトグラファーさんは本当に職人です！！！" },
        zh: { text: "这是我第一次拍身材写真，和担心的不一样，拍摄过程非常舒适。摄影师教我如何摆姿势和表情，所以就连未修图的照片也都非常满意，难以选择ㅠㅠ 以后我觉得还会一直在Fitgirls拍摄。摄影师真的是大师！！！" }
    },
    "naver-4": {
        en: { text: "It was a body profile shoot I had been dreaming of since 2019 at Inafit. I worked out for 3 years after having a baby to get abs, then rushed right over. I did the unlimited concept package, and the photographer was so cheerful and passionate that time flew by and we had a blast! I loved being able to check my posture in the mirror and monitor the shots in real time. Even if it's your first body profile, don't worry — as long as the photographer is a pro, you'll be fine :D" },
        ja: { text: "2019年のInafit時代からウォッチリストに入れていたボディプロフィール撮影。産後3年間のトレーニングで腹筋を作り、すぐに駆けつけました。せっかくなのでコンセプト無制限プランにしたのですが、カメラマンさんがとっても陽気で情熱的で時間があっという間に過ぎ、本当に楽しく撮影できました！鏡を見ながらポーズを確認でき、撮影した写真をすぐモニタリングしながら進めていくのが良かったです！初のボディプロフィールでも、プロのカメラマンさんがいれば心配無用です :D" },
        zh: { text: "这是我从2019年Inafit时代就心心念念着的身材写真拍摄。生孩子后运动了3年练出腹肌，马上跑去了。我选择了无限概念方案，摄影师非常开朗热情，时间飞速流逝，拍得非常开心！边照镜子调整姿势，边实时回看拍摄照片，体验非常好！就算是第一次拍身材写真，只要遇上专业摄影师就不用担心 :D" }
    },
    "naver-5": {
        en: { text: "If you're wondering where to get your body profile photos taken, I really really recommend this place!! It was my first body profile and I didn't know what to do, but they enthusiastically showed me poses and maintained a comfortable atmosphere, so I loved every single raw photo!! They even print the photos on the day ㅠㅠㅠ My satisfaction level is at its absolute peak!!!!!!! Next time I'll work out harder and try a different concept!!!" },
        ja: { text: "ボディプロフィール撮影をどこでしようか迷っているなら、本当に本当にここをおすすめします！！初めてのボディプロフィールで何をすればいいかわからなかったのですが、情熱的にポーズを教えてくださり、リラックスした雰囲気を維持してくださったので、原本が全部気に入りました！！当日に写真プリントまでしてくださるし ㅠㅠㅠ 本当に満足度は最高！！！！！！！ 次はもっとトレーニングに励んで別のコンセプトで撮ってみます！！！" },
        zh: { text: "如果你在纠结在哪里拍身材写真，真的真的推荐这里！！这是我第一次拍身材写真，完全不知道该怎么做，但摄影师热情地教我摆姿势，保持了舒适的氛围，所以每一张原始照片我都喜欢！！当天还能打印照片 ㅠㅠㅠ 真的满意度达到最高！！！！！！！ 下次会更努力地锻炼，尝试不同的概念！！！" }
    },
    "naver-6": {
        en: { text: "I rarely leave reviews, but I'm leaving one. The photographer is kind and a veteran. It was my first body profile so my movements and posture were awkward, but he gave me really detailed direction — he told me which side of my face looks better, which parts of my body to highlight, set up a mirror in front so I could see myself, and showed me how each shot looked on a big screen so it was easy to correct my posture and expression on the spot. I was especially grateful when my prepared outfit looked too stiff on camera, and he instantly picked an outfit that made my body look better. Even when I vaguely described what I wanted, he had the amazing ability to turn abstract descriptions into concrete images. If it's your first body profile, I highly recommend Fitgirls." },
        ja: { text: "レビューはあまり書かない方ですが、書きます。カメラマンさんが親切でベテランです。初めてのボディプロフィールで動きも姿勢もぎこちなかったのですが、本当に細かくディレクションしてくれました。どちらの顔が綺麗に映るか、体のどの部分を強調するといいかを教えてくれて、正面には鏡を置いて今の自分の姿がわかるようにしてくれました。1カット撮るたびに大きな画面で自分の姿がどう映っているか見せてくれて、即座に姿勢や表情を修正しやすかったです。特に持参した衣装が写真ではもったいなく見えると気づいてくれて、その場で私の体がより綺麗に見える衣装を選んでくれたのが助かりました。初ボディプロフィールには迷わずFitgirlsをおすすめします。" },
        zh: { text: "我很少留评，但这次要留。摄影师亲切、经验丰富。这是我第一次拍身材写真，动作和姿势都很生硬，但他给了我非常详细的指导——告诉我哪一侧的脸更好看、哪些部位要突出，在前面放了面镜子让我能看见自己的样子，还每拍一张就在大屏幕上让我看效果，便于随时调整姿势和表情。特别是我准备的衣服拍出来感觉太硬了，他立刻帮我挑了一件能让身材更好看的衣服，非常感谢。即使我模糊地描述想要的效果，他也有把抽象描述变为具体画面的出色能力。第一次拍身材写真，强烈推荐Fitgirls。" }
    },
    "naver-7": {
        en: { text: "Choosing Fitgirls was truly the best decision I made this year! haha I was completely awkward with poses and expressions for my first body profile prep, but the constant coaching on how to make photos look better led to many great results 👍 So incredibly passionate!!! And really attentive. The slight direction of the shoulder, the position of the hands, the way the legs cross — coaching down to those tiny details was so helpful ㅠㅠ On the way home, my trainer who came with me said it's rare to find someone this passionate, and I'd made a great choice~~ There are so many raw shots I like, I can't wait to see how much better the retouched ones will be 💫 I'll be recommending this place to anyone who wants body profile photos!" },
        ja: { text: "Fitgirlsを選んだのは今年一番の英断でした！笑 ボディプロフィール初挑戦でポーズも表情も全部ぎこちなかったのですが、どうすれば写真がより綺麗に見えるか、ずっとコーチングしてくださったおかげで良い結果物がたくさん出ました👍 本当に情熱が溢れています！！！しかも本当に繊細なんです。肩の微妙な方向、手の位置、脚の組み方など、細かいことまで指摘してくださって本当に助かりましたㅠㅠ 帰り道に一緒に来たトレーナーさんも、こんなに情熱的にやってくれる方は珍しい、スタジオ選びが上手かったと言っていました〜〜 原本でも気に入った写真がたくさんあるのに、補正したらどれほど気に入るか、今からとても楽しみです💫 バディプロフィールを撮りたい方がいたら迷わずここを勧めます！" },
        zh: { text: "选择Fitgirls绝对是我今年做得最正确的决定！哈哈 初次准备拍身材写真，姿势和表情都很生硬，但摄影师一直不断地指导我如何让照片更好看，成果丰硕 👍 真的热情满满！！！而且真的很细心。肩膀微妙的方向、手的位置、腿交叉的方式等等，连这些细节都一一指出，帮助很大ㅠㅠ 回去的路上，和我一起去的训练师也说，像这样热情的人真的很难得，说我选对了地方~~ 原图里就有很多喜欢的，修图后会更喜欢多少呢，现在就很期待了💫 周边有人想拍身材写真的话，我会毫不犹豫地推荐这里！" }
    },
    "naver-8": {
        en: { text: "I was too embarrassed to post my photo.. so I'm just leaving a text review.. I didn't make as much effort as I planned during my preparation, so I honestly wasn't expecting much...but the photographer seriously has golden hands; what is she doing here?? ㅠ Every single shot I loved, making me look like a celebrity, and during the shoot I kept wanting to do better and was full of thoughts like 'I wish I had lost a bit more weight'...ㅠㅠㅠ❤️❤️❤️The photographer is truly the best." },
        ja: { text: "写真を載せるのは恥ずかしくて..文章だけで残したいと思います..準備期間にそれほど努力できなかったので、正直あまり期待していなかったのですが...카メラマンさん、金の手を持ってるのでは? ；；ㅠ 写真のどれもが気に入って、芸能人みたいに撮ってくれて、撮影中ずっともっと頑張りたいという気持ちになって、もう少し痩せてから来ればよかったという後悔が胸一杯...ㅠㅠㅠ❤️❤️❤️カメラマンさん本当に最高です" },
        zh: { text: "照片太不好意思贴出来了..所以只留文字吧..筹备期间没有付出应有的努力，老实说没抱太大期望...但是摄影师简直有一双金手；她怎么会在这里？？ㅠ 每张照片都很满意，把我拍得像明星一样，整个拍摄过程中一直想做得更好，心里充满了'要是再减点肥就好了'这样的想法......ㅠㅠㅠ❤️❤️❤️摄影师真的是最棒的。" }
    },
    "naver-9": {
        en: { text: "It's already my 3rd body profile shoot at Fitgirls~ 🤭🤭🤭 After the first great experience in 2019, I came back in February this year for the second time, and a few days ago for the third~. The photographer is always kind and creates such a comfortable atmosphere that I keep coming back! 🤣🤣🤣 Even though it's my third time, I'm always moved by how he thinks up different moods and concepts each time! Always stay healthy, and I don't know when my fourth visit will be, but if I feel like doing another body profile, I'll definitely come back~ Stay healthy and enjoy the Chuseok holiday!" },
        ja: { text: "Fitgirlsでのボディプロフィール撮影、もう3回目です～ 🤭🤭🤭 2019年の最初の撮影での良い思い出から、今年の2月に2回目、そして数日前に3回目まで～ いつも親切でリラックスした雰囲気でついまた来てしまいます！🤣🤣🤣 3回目でも、毎回違う雰囲気で考えてくれて撮影してくださる姿に、いつも感動しています！ いつもお元気でいてください。4回目がいつになるかわかりませんが、もしまたボディプロフィールを撮りたくなったらまた来ますね〜 お元気で楽しいお盆休みを！" },
        zh: { text: "已经是在Fitgirls的第3次身材写真拍摄了～ 🤭🤭🤭 2019年的第一次美好记忆让我在今年二月回来拍了第二次，几天前又拍了第三次～ 摄影师总是那么亲切，营造出舒适的氛围，让我一而再再而三地回来！🤣🤣🤣 虽然已经是第三次了，每次看到他为我构思不同氛围和概念的样子，我都深受感动！ 希望您一直健康，不知道第四次会是什么时候，但如果哪天又想拍身材写真，我一定会再来～ 保重身体，祝您过一个愉快的秋夕假期！" }
    },
    "naver-10": {
        en: { text: "Hello~^^ I'm so glad I chose Fitgirls Studio. The photographer overflows with passion and creates a comfortable atmosphere — I am so, so, SO satisfied with the various concepts~~♡♡ I lost track of time during the shoot! Thank you so much 😀" },
        ja: { text: "こんにちは～^^ Fitgirlsスタジオを選んで本当によかったです。カメラマンさんは情熱に満ち溢れていて、居心地の良い雰囲気で多様なコンセプト、大大大満足です～～♡♡ 時間を忘れて撮影しました！ありがとうございます 😀" },
        zh: { text: "您好～^^ 我太庆幸选择了Fitgirls Studio。摄影师充满热情，营造出舒适的氛围，各种各样的概念让我大大大满意～～♡♡ 拍摄中忘记了时间！非常感谢 😀" }
    },
    "naver-11": {
        en: { text: "A friend recommended Fitgirls for my first-ever body profile in my late 40s — it was a godsend 🤩🥰 I'm normally shy and awkward about having my photo taken, so I was very worried, but today the photographer guided me so naturally and comfortably through poses that I was amazed throughout the whole shoot. Body profiles are definitely best done at Fitgirls 🥰🥰🥰" },
        ja: { text: "40代後半、人生初のボディプロフィールを友人の勧めでFitgirlsで撮影したのは、神の一手でした🤩🥰 普段写真を撮られるのが恥ずかしくて苦手なのでとても心配していたのですが、今日カメラマンさんが自然でリラックスした雰囲気でポーズを誘導してくれて、撮影中ずっと感動し通しでした。やはりボディプロフィールはFitgirlsですね🥰🥰🥰" },
        zh: { text: "40多岁人生第一次拍身材写真，在朋友的推荐下选择了Fitgirls，真是神来之笔🤩🥰 平时对拍照感到害羞和不自在，所以非常担心，但今天摄影师以如此自然舒适的方式引导我摆姿势，整个拍摄过程中我都赞叹不已。身材写真果然还得是Fitgirls🥰🥰🥰" }
    },
    "naver-12": {
        en: { text: "My body wasn't perfect yet... but they led me comfortably and I got so many beautiful photos!!! The owner is truly the best 👍🏻 I want to come back next year tooㅎㅎㅎ He picked out outfits suited to my style and handled all the concepts like a pro, so thank you!!!❤️" },
        ja: { text: "体は完璧じゃなかったけど... 快適にリードしてくださったおかげで、綺麗な写真をたくさん撮れました！！！本当に代表さん最高です👍🏻 来年もまた撮りに行きたいですね〜ㅎㅎㅎ スタイルに合わせて服も選んでくださって、コンセプトも全部テキパキとやってくださってありがとうございました！！！❤️" },
        zh: { text: "身材并不完美……但他引导得非常舒适，拍了好多好看的照片！！！老板真的是最棒的👍🏻 明年还想去拍ㅎㅎㅎ 他帮我挑选了适合我风格的衣服，所有概念都处理得井井有条，非常感谢！！！❤️" }
    },
    "naver-13": {
        en: { text: "I was so nervous going for my first body profile shoot, worried because my body wasn't perfect either. But I managed to get through it safely! The photographer recommended outfits and backgrounds that suited me well. Especially for posing — I was really worried about that! I'd watched videos but couldn't get the feel right, but he demonstrated each pose and showed me how to highlight my strengths, so even as a first-timer I could eventually pose naturally! Thanks to that, the atmosphere was comfortable throughout, and I got to try so many poses against many different backgrounds! It really made me realize that body profiles need to be done with a skilled photographer... I'm so glad I shot my first body profile at Fitgirls! Thank you so much 🙏" },
        ja: { text: "初めてのボディプロフィール撮影に行って、緊張しすぎて体も完全じゃないと心配が多かったです。でも、こんな私も無事に上手く撮れました！ カメラマンさんが私に合った衣装の選択から背景まで、上手く推薦してくださいました。特に、ポージングが一番心配でしたよね！動画を見てはいたものの感覚がよくわからなかったのに、一つひとつどうすれば私の長所を引き出せるかデモを見せながらやってくれて、初めて撮る私でも後半には自然にポーズが取れるようになりました！ おかげで雰囲気も穏やかな中で進み、たくさんの背景で望んだポーズをたくさん試せてとても良かったです！ 本当にボディプロフィールは上手なカメラマンさんにお願いしないとと感じました...初めてのボディプロフィールをFitgirlsで撮れてよかったです！とても感謝します🙏" },
        zh: { text: "第一次去拍身材写真，非常紧张，担心自己身材也不完美。但就连我这样的人也顺利地拍完了！摄影师帮我推荐了适合我的服装和背景。尤其是姿势方面，真的很担心！虽然看了视频但感觉还是不太对，摄影师逐一示范每个姿势，告诉我如何突出优点，这样即使是第一次拍摄，后来我也能自然地摆姿势了！ 多亏了这些，拍摄过程始终轻松愉快，在众多背景下尝试了各种我想要的姿势，非常开心！ 真的感受到身材写真必须要找有技术的摄影师才行......能在Fitgirls拍第一次身材写真太好了！非常感谢🙏" }
    },
    "naver-14": {
        en: { text: "It was my first body profile, and the photographer is male, so I was a little nervous going in.. but the photographer was so kind that I was able to shoot without any pressure! He had so many outfits available that I could shoot in various concepts with his help!! He created such a comfortable atmosphere that I had a successful body profile shoot 💓 It's a place I want to recommend ☺️👍🏻" },
        ja: { text: "初めてのボディプロフィールで、男性カメラマンさんということで少し緊張して行ったのですが..!! カメラマンさんが本当に親切で、プレッシャーなく撮ることができました！ 衣装もとてもたくさん持っていて、助けてもらいながらいろんなコンセプトで撮ることができました！！ 居心地の良い雰囲気を作ってくださったおかげで、ボディプロフィール撮影を成功裏に終えました 💓 おすすめしたい場所です☺️👍🏻" },
        zh: { text: "这是我第一次拍身材写真，摄影师是男性，所以去的时候有点紧张..！！摄影师非常亲切，让我能够毫无压力地拍摄！他拥有非常多的服装，借助他的帮助我能以各种概念拍摄！！他营造的舒适氛围让我顺利完成了身材写真拍摄 💓 真是让我很想推荐的地方☺️👍🏻" }
    },
    "naver-15": {
        en: { text: "The photographer is the best — the communication before the shoot was great, the shoot was so fun, the directing was excellent, and the range of outfits available was wonderful too. I had such a great time! I already want to go back and shoot again ㅎㅎ" },
        ja: { text: "カメラマンさん最高です。撮影前からのコミュニケーションがとても良く、撮影もすごく楽しかったし、ディレクティングも上手いし、用意されている衣装も多くて良かったです。本当に楽しく撮ってきました！もうすぐにでもまた行って撮影したいですねㅎㅎ" },
        zh: { text: "摄影师最棒了——拍摄前的沟通很顺畅，拍摄过程很有趣，指导也很到位，可以租用的服装种类也很丰富，非常开心！已经迫不及待想再去拍了ㅎㅎ" }
    },
    "naver-16": {
        en: { text: "Fitgirls is the best!!!! It was my first body profile so I was so worried going in, but he suggested better poses and more flattering angles, so I ended up with so many satisfying shots ㅠㅠ He also shot for a really long time so I honestly can't believe how good everything turned out! So incredibly passionate, and with such bright energy that I could push through and shoot well the whole time!! If I do a body profile again, I'm definitely doing it at Fitgirls >< " },
        ja: { text: "Fitgirls最高です！！！！ 初めてのボディプロフィールですごく心配して行ったのですが、どのポーズがより綺麗に見えるか提案してくれて教えてくださったので、本当に満足できる写真がたくさん撮れましたㅠㅠ しかも撮影をすごく長くやってくださったので、逆にもうこれで十分ってなるくらい、すごく情熱的なんです。そして明るいエネルギーをものすごく放っていて、撮影中ずっと力を引き出してもらって上手く撮ることができました！！ また次にボディプロフィールに挑戦するならFitgirlsでやると思います><" },
        zh: { text: "Fitgirls最棒了！！！！ 第一次拍身材写真，去的时候非常担心，但他建议了更好的姿势和更好看的角度，让我拍到了很多满意的照片ㅠㅠ 拍摄时间也很长，反而感觉这就够了，真的非常热情！而且散发着超强正能量，整个拍摄过程中都能感受到他给我带来的力量，让我拍得很好！！ 如果下次再挑战身材写真，我一定还会在Fitgirls拍><" }
    },
    "naver-17": {
        en: { text: "I was nervous and embarrassed since it was my first body profile, but the photographer helped me pose naturally and there were so many different props and backgrounds that I got so many satisfying results at a great price! I could really feel that all my hard preparation had paid off!" },
        ja: { text: "初めてのボディプロフィールで緊張して恥ずかしかったのですが、自然に演出できるようにポーズも取らせてもらえて、小道具や背景がとても多様で、価格に見合った満足のいく結果物がたくさんありました！ 一生懸命準備した甲斐を感じることができました！" },
        zh: { text: "第一次拍身材写真，既紧张又害羞，但摄影师帮我摆好了自然的姿势，道具和背景种类非常丰富，以这个价格获得了很多令人满意的成果！真的感受到了努力准备的意义！" }
    },
    "naver-18": {
        en: { text: "In various backgrounds and moods, he tells you so delicately and precisely how to position your face and body line to look best 🥹👍🏻 He puts all his passion into the shoot… I've done body profiles a few times now, but this is not an assembly-line or cookie-cutter place. He truly creates individual masterpieces for you ❤️‍🔥 He's a genuine expert who stands out from other studios…. Absolutely the real deal 👍🏻👍🏻👍🏻✨✨✨" },
        ja: { text: "様々な背景でいろんなムードで、でもまた簡単に、どうすれば顔のラインが綺麗で体のラインが綺麗に見えるか、とても繊細に全部教えてくださいます🥹👍🏻 本当に全情熱を注いで撮ってくださいます… ボディプロフィールは何度か撮ったことがありますが、工場式やコピー式ではなく、本当に自分だけの作品を作ってくれる場所❤️‍🔥 他とは本当に差別化された専門家です…. 本当に本物です👍🏻👍🏻👍🏻✨✨✨" },
        zh: { text: "在各种背景和氛围下，他非常细心地告诉你如何让脸部线条和身体线条看起来最好🥹👍🏻 他把所有的热情都倾注到拍摄中……我拍过几次身材写真，但这里不是流水线或模仿式的，真的为你创作属于自己的独特作品❤️‍🔥 他是一位与众不同的真正专家…. 真的是真材实料👍🏻👍🏻👍🏻✨✨✨" }
    },
    "naver-19": {
        en: { text: "I can't believe how lucky and happy I am to have shot my very first body profile — a lifelong bucket list item — at Fitgirls!! 🫶🏻 My PT trainer recommended it and I booked without a second thought, and it was absolutely the right call! The photographer creates such a comfortable atmosphere during the shoot and puts her heart and soul into every shot.. I felt my confidence soaring as I happily shot away ㅠㅠ!! The photos even came out beautifully and the backgrounds go without saying — everything was perfect!! I got so many amazing life shots here..ㅠ0ㅠ🩷💙 It'll be hard to choose for the retouched selection — there are just too many beautiful shots to choose from...ㅠㅠ I want to shoot with this photographer again if I ever do another body profile!! Thank you so much for the comfortable atmosphere and the beautiful shots!!!❤️" },
        ja: { text: "バケットリストの中の初バプをFitgirlsで撮れて、どれほど幸運で幸せなことかわかりません！！ 🫶🏻 ピーティー先生の推薦で迷わず予約したのですが、私の選択はとても大正解でした！カメラマンさんが撮影中、リラックスした雰囲気を作ってくださり、本当に情熱を込めて撮ってくださって..。自信が溢れ出しながら楽しく撮影していましたㅠㅠ！！写真まで綺麗に出てきて、背景はもちろんすべてが最高でした！！！！ここで人生写真を本当にたくさん撮れました..ㅠ0ㅠ🩷💙 補正本を選ぶのが難しいです...綺麗な写真が多すぎて...ㅠㅠ 次もボディプロフィールを撮るならまたこのカメラマンさんに撮ってもらいたいです！！リラックスした雰囲気..また綺麗に撮ってくださって本当にありがとうございます！！！❤️" },
        zh: { text: "我不知道有多幸运和幸福，能在Fitgirls拍摄我梦寐以求的第一次身材写真！！ 🫶🏻 在私人教练的推荐下毫不犹豫地预约了，我的选择绝对是正确的！摄影师在拍摄时营造了舒适的氛围，全身心投入拍摄..我自信满满、愉快地拍着ㅠㅠ！！照片拍出来还很好看，背景自然不用说，一切都太完美了！！！！在这里拍了好多张人生照……ㅠ0ㅠ🩷💙 修图照片的挑选会很难——好看的太多了……ㅠㅠ 如果以后再拍身材写真，还想请这位摄影师来拍！！感谢营造如此舒适的氛围，并拍出了这么美的照片！！！❤️" }
    },
    "naver-20": {
        en: { text: "Now I understand why everyone raves about Fitgirls. I was honestly embarrassed and stiff because my body wasn't fully prepared, but following the photographer's lead with poses and expressions, I naturally relaxed, and my body was captured with only my best features highlighted. The photos came out so much better than my actual body that my self-esteem went way up! Next time I want to come back in even better shape. And if I do, I'll choose Fitgirls again without a second thought." },
        ja: { text: "なぜ皆がFitgirlsだFitgirlsだと言うのかわかりました。実際、体が完全に準備できておらず恥ずかしくて緊張していたのですが、カメラマンさんが導いてくださるままにポーズを取り表情を作っていったら、いつの間にか自然な表情になっていて、私のボディが長所だけ最大化されて撮れていました。実際の自分の体よりずっとかっこよく撮れた写真に、自信がとても上がりました！次はもっと準備された体でまた撮りたいです。そしてもし撮るなら、迷わずまたFitgirlsを選ぶと思います。" },
        zh: { text: "现在我明白为什么大家都说Fitgirls了。老实说，我的身材没有完全准备好，感到害羞和紧张，但按照摄影师的引导摆姿势和做表情，不知不觉就自然放松了，而且照片中只展现了我的优点，拍出来非常好看。照片拍得比我实际的身材好多了，让我的自信心大大提升！下次想以更好的身材再来拍。如果拍的话，我会毫不犹豫地再次选择Fitgirls。" }
    }
};

async function updateReviews() {
    console.log('🔄 Firebase에서 리뷰 컬렉션 가져오는 중...');
    
    const reviewsRef = collection(db, 'reviews');
    const snapshot = await getDocs(reviewsRef);
    
    console.log(`📄 총 ${snapshot.size}개의 리뷰 문서 발견`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const reviewId = data.id || docSnap.id;
        
        if (translations[reviewId]) {
            const t = translations[reviewId];
            console.log(`✏️  업데이트 중: ${reviewId} (${data.author})`);
            
            try {
                await updateDoc(doc(db, 'reviews', docSnap.id), {
                    translations: {
                        en: t.en,
                        ja: t.ja,
                        zh: t.zh
                    }
                });
                updatedCount++;
                console.log(`   ✅ 완료: ${reviewId}`);
            } catch (error) {
                console.error(`   ❌ 오류: ${reviewId}`, error.message);
            }
        } else {
            skippedCount++;
        }
    }
    
    console.log(`\n🎉 완료! 업데이트: ${updatedCount}개, 건너뜀: ${skippedCount}개`);
    process.exit(0);
}

updateReviews().catch((err) => {
    console.error('치명적 오류:', err);
    process.exit(1);
});
