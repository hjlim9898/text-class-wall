import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1CAMpp6J3wMv78OsTeunoK4XUHbB7jQY",
  authDomain: "class-wall-6abcc.firebaseapp.com",
  projectId: "class-wall-6abcc",
  storageBucket: "class-wall-6abcc.firebasestorage.app",
  messagingSenderId: "578562174832",
  appId: "1:578562174832:web:0a10dfeb835af02a2469b5"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();
let currentUser = null;
let currentRole = "student";

// ===================================================
// 우리 반 담벼락 - 시작점
//
// 메모를 쓰면 올린 순서대로 담벼락에 붙습니다.
// 지금은 데이터가 아래 배열에만 들어 있어서,
// 브라우저를 새로고침하면 전부 사라집니다.
// ===================================================


// --- 메모 목록 ---
// createdAt 은 메모를 쓴 시각(밀리초)입니다. 이 값으로 순서를 정합니다.
let memos = [
  { id: 1, text: "오늘 과학 시간에 한 실험이 재미있었다", createdAt: 1757030400000 },
  { id: 2, text: "궁금한 점 - 물은 왜 100도에서 끓나요?", createdAt: 1757030500000 },
  { id: 3, text: "모둠 친구들이 도와줘서 고마웠다", createdAt: 1757030600000 }
];

let nextId = 4;  // 새 메모에 붙일 번호


// ===================================================
// 데이터를 다루는 함수 세 개
// 백엔드 1 시간에 이 세 개가 Firestore를 쓰는 코드로 바뀝니다.
// ===================================================

// 메모를 읽어 옵니다.
// 백엔드 1: 여기가 Firestore에서 가져오는 코드로 바뀝니다.
//           순서는 orderBy("createdAt") 으로 맞춥니다.
async function loadMemos() {
  if (!currentUser) throw new Error('로그인이 필요합니다.');
  const snapshot = await getDocs(query(collection(db, "memos"), orderBy("createdAt")));
  return snapshot.docs.map(function (memoDoc) {
    const data = memoDoc.data();
    return {
      id: memoDoc.id,
      text: data.text,
      createdAt: data.createdAt,
      canDelete: currentRole === "teacher"
    };
  });
}

// 메모를 새로 씁니다.
// 백엔드 2: 여기에 "누가 썼는지"(uid)를 함께 저장하게 됩니다.
async function addMemo(text) {
  if (!currentUser) throw new Error('로그인이 필요합니다.');
  await addDoc(collection(db, "memos"), {
    text,
    createdAt: serverTimestamp(),
    uid: currentUser.uid
  });
}

// 메모를 지웁니다.
// 백엔드 2: 지금은 누구든 남의 메모를 지울 수 있습니다. 이걸 막는 것이 과제입니다.
async function deleteMemo(id) {
  if (!currentUser || currentRole !== "teacher") {
    throw new Error('교사만 메모를 지울 수 있습니다.');
  }
  await deleteDoc(doc(db, "memos", id));
}


// ===================================================
// 화면 그리기
// ===================================================

async function render() {
  const wall = document.getElementById("wall");
  wall.innerHTML = "";

  const memos = await loadMemos();
  memos.forEach(function (memo) {
    wall.appendChild(makeMemo(memo));
  });
}

// 메모 한 장 만들기
function makeMemo(memo) {
  const div = document.createElement("div");
  div.className = "memo";

  if (memo.canDelete) {
    const del = document.createElement("button");
    del.textContent = "×";
    del.onclick = async function () {
      await deleteMemo(memo.id);
      await render();
    };
    div.appendChild(del);
  }

  const span = document.createElement("span");
  span.textContent = memo.text;
  div.appendChild(span);

  return div;
}


// ===================================================
// 메모 쓰는 칸
// 엔터를 누르면 담벼락에 붙습니다 (줄바꿈은 Shift + 엔터)
// ===================================================

const input = document.getElementById("input");
const loginStatus = document.getElementById("loginStatus");
const loginButton = document.getElementById("loginButton");
const saveButton = document.getElementById("saveButton");

// 인증 상태 확인이 늦어져도 로그인 버튼은 즉시 동작하게 합니다.
loginButton.onclick = async function () {
  if (currentUser) {
    await signOut(auth);
    return;
  }

  loginStatus.textContent = "Google 로그인 창을 여는 중입니다.";
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error.code === "auth/popup-blocked" || error.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
      return;
    }

    if (error.code === "auth/popup-closed-by-user") {
      loginStatus.textContent = "로그인 창이 닫혔습니다. 다시 시도해 주세요.";
    } else if (error.code === "auth/unauthorized-domain") {
      loginStatus.textContent = "Firebase에 현재 사이트 주소를 허용 도메인으로 등록해 주세요.";
    } else {
      loginStatus.textContent = `로그인에 실패했습니다. (${error.code || "unknown"})`;
    }
  }
};

// 로그인 상태에 맞게 버튼과 메모 입력 칸을 바꿉니다.
function showLoginState(user) {
  if (user) {
    loginStatus.textContent = currentRole === "teacher" ? "교사로 로그인했습니다." : "학생으로 로그인했습니다.";
    loginButton.textContent = "로그아웃";
    input.disabled = false;
    saveButton.disabled = false;
    input.placeholder = "메모를 쓰고 엔터";
  } else {
    loginStatus.textContent = "로그인이 필요합니다.";
    loginButton.textContent = "Google로 로그인";
    input.disabled = true;
    saveButton.disabled = true;
    input.placeholder = "로그인하면 메모를 쓸 수 있습니다";
  }
}

// 입력한 게시글을 저장하고 담벼락을 다시 그립니다.
async function saveMemo() {
  const text = input.value.trim();
  if (text === "") return;

  await addMemo(text);
  input.value = "";
  await render();
}

saveButton.onclick = saveMemo;

input.onkeydown = async function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    await saveMemo();
  }
};


// 로그인 확인이 끝나면 첫 화면을 그립니다.
onAuthStateChanged(auth, async function (user) {
  currentUser = user;
  currentRole = "student";
  if (user) {
    try {
      const roleDoc = await getDoc(doc(db, "users", user.uid));
      if (roleDoc.exists() && roleDoc.data().role === "teacher") {
        currentRole = "teacher";
      }
    } catch (error) {
      console.error("역할 정보를 읽지 못했습니다.", error);
    }
  }
  showLoginState(user);
  if (user) {
    await render();
    input.focus();
  } else {
    document.getElementById("wall").innerHTML = "";
  }
}, function (error) {
  console.error("로그인 상태를 확인하지 못했습니다.", error);
  loginStatus.textContent = `로그인 초기화에 실패했습니다. (${error.code || "unknown"})`;
});
