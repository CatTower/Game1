<script lang="ts">
  import { appState, type UserProfile } from '../lib/appStore.svelte';

  // Mode: 'login' | 'register'
  let mode = $state<'login'|'register'>(appState.allUsers.length > 0 ? 'login' : 'register');
  
  // Login State
  let selectedUser = $state<UserProfile | null>(null);
  let loginPin = $state('');

  // Register State
  let nickname = $state('');
  let pin = $state('');
  let finalAvatarImage = $state<string | null>(null);
  let errorMsg = $state('');

  // Cropper state
  let fileInput: HTMLInputElement;
  let canvas: HTMLCanvasElement;
  let rawImageSrc = $state<string | null>(null);
  let imgElement: HTMLImageElement | null = $state(null);
  
  let baseScale = 1;
  let userScale = $state(1);
  let userRotation = $state(0);
  let offsetX = $state(0);
  let offsetY = $state(0);
  
  // Drag / Pinch state
  let touchState = 'none'; // 'none', 'pan', 'pinch'
  let startX = 0;
  let startY = 0;
  let initialDistance = 0;
  let initialAngle = 0;
  let initialScale = 1;
  let initialRotation = 0;

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          rawImageSrc = e.target.result;
          // Reset crop state
          userScale = 1;
          userRotation = 0;
          offsetX = 0;
          offsetY = 0;
        }
      };
      reader.readAsDataURL(target.files[0]);
    }
  }

  function onImgLoad(e: Event) {
    imgElement = e.target as HTMLImageElement;
    baseScale = 120 / Math.min(imgElement.naturalWidth, imgElement.naturalHeight);
    userScale = 1;
    userRotation = 0;
    offsetX = 0;
    offsetY = 0;
  }

  function getPinchData(touches: TouchList) {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const midX = (touches[0].clientX + touches[1].clientX) / 2;
    const midY = (touches[0].clientY + touches[1].clientY) / 2;
    return { distance, angle, midX, midY };
  }

  function startDrag(e: MouseEvent | TouchEvent) {
    if (!rawImageSrc) return;
    
    if ('touches' in e) {
      if (e.touches.length === 1) {
        touchState = 'pan';
        startX = e.touches[0].clientX - offsetX;
        startY = e.touches[0].clientY - offsetY;
      } else if (e.touches.length === 2) {
        touchState = 'pinch';
        const pinch = getPinchData(e.touches);
        initialDistance = pinch.distance;
        initialAngle = pinch.angle;
        initialScale = userScale;
        initialRotation = userRotation;
        startX = pinch.midX - offsetX;
        startY = pinch.midY - offsetY;
      }
    } else {
      touchState = 'pan';
      startX = e.clientX - offsetX;
      startY = e.clientY - offsetY;
    }
  }

  function onDrag(e: MouseEvent | TouchEvent) {
    if (touchState === 'none' || !rawImageSrc) return;
    e.preventDefault(); 

    if ('touches' in e) {
      if (e.touches.length === 1 && touchState === 'pan') {
        offsetX = e.touches[0].clientX - startX;
        offsetY = e.touches[0].clientY - startY;
      } else if (e.touches.length === 2 && touchState === 'pinch') {
        const pinch = getPinchData(e.touches);
        offsetX = pinch.midX - startX;
        offsetY = pinch.midY - startY;
        if (initialDistance > 0) {
          userScale = initialScale * (pinch.distance / initialDistance);
        }
        userRotation = initialRotation + (pinch.angle - initialAngle);
      }
    } else {
      offsetX = e.clientX - startX;
      offsetY = e.clientY - startY;
    }
  }

  function stopDrag(e: MouseEvent | TouchEvent) {
    if ('touches' in e && e.touches.length > 0) {
      if (e.touches.length === 1) {
        touchState = 'pan';
        startX = e.touches[0].clientX - offsetX;
        startY = e.touches[0].clientY - offsetY;
      }
      return;
    }
    touchState = 'none';
  }

  function generateAvatar() {
    if (!imgElement || !rawImageSrc) {
      errorMsg = '사진을 먼저 업로드해주세요.';
      return;
    }

    const w = 150;
    const h = 200;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);

    const faceRadius = 50;
    const faceCX = w / 2;
    const faceCY = faceRadius + 10; 

    ctx.save();
    ctx.beginPath();
    ctx.arc(faceCX, faceCY, faceRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const viewSize = 120;
    const finalScale = baseScale * userScale;
    const drawW = imgElement.naturalWidth * finalScale;
    const drawH = imgElement.naturalHeight * finalScale;
    
    const imgX = (viewSize - drawW) / 2 + offsetX;
    const imgY = (viewSize - drawH) / 2 + offsetY;

    const mapScale = (faceRadius * 2) / viewSize;
    
    const destX = faceCX - faceRadius + imgX * mapScale;
    const destY = faceCY - faceRadius + imgY * mapScale;
    const destW = drawW * mapScale;
    const destH = drawH * mapScale;

    ctx.save();
    const imgCenterX = destX + destW / 2;
    const imgCenterY = destY + destH / 2;
    ctx.translate(imgCenterX, imgCenterY);
    ctx.rotate((userRotation * Math.PI) / 180);
    ctx.drawImage(imgElement, -destW / 2, -destH / 2, destW, destH);
    ctx.restore();
    
    ctx.restore();
    ctx.beginPath();
    ctx.arc(faceCX, faceCY, faceRadius, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#333';
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#333';

    const neckY = faceCY + faceRadius;
    const pelvisY = neckY + 50;
    ctx.moveTo(faceCX, neckY);
    ctx.lineTo(faceCX, pelvisY);

    const shoulderY = neckY + 10;
    ctx.moveTo(faceCX - 30, shoulderY + 20); 
    ctx.lineTo(faceCX, shoulderY); 
    ctx.lineTo(faceCX + 30, shoulderY + 20); 

    ctx.moveTo(faceCX - 25, pelvisY + 40); 
    ctx.lineTo(faceCX, pelvisY); 
    ctx.lineTo(faceCX + 25, pelvisY + 40); 

    ctx.stroke();

    finalAvatarImage = canvas.toDataURL('image/png');
    rawImageSrc = null; 
    errorMsg = '';
  }

  function register() {
    if (nickname.trim() === '') {
      errorMsg = '닉네임을 입력해주세요.';
      return;
    }
    // Check duplicate
    if (appState.allUsers.find(u => u.nickname === nickname.trim())) {
      errorMsg = '이미 존재하는 닉네임입니다.';
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      errorMsg = '4자리 숫자 PIN을 입력해주세요.';
      return;
    }
    if (!finalAvatarImage && !rawImageSrc) {
      errorMsg = '아바타 사진을 등록해주세요.';
      return;
    }

    if (rawImageSrc && !finalAvatarImage) {
      generateAvatar();
    }

    if (finalAvatarImage) {
      appState.registerUser(nickname, pin, finalAvatarImage);
    }
  }

  function login() {
    if (!selectedUser) {
      errorMsg = '캐릭터를 선택해주세요.';
      return;
    }
    if (loginPin.length !== 4) {
      errorMsg = '4자리 PIN 번호를 입력해주세요.';
      return;
    }
    const success = appState.loginUser(selectedUser.nickname, loginPin);
    if (!success) {
      errorMsg = 'PIN 번호가 일치하지 않습니다.';
    }
  }
</script>

<div class="register-scene scene">
  <div class="card">
    {#if mode === 'login'}
      <h1 class="title">캐릭터 선택</h1>
      <p class="subtitle">이전에 만든 내 캐릭터를 골라주세요</p>

      <div class="user-list">
        {#each appState.allUsers as user}
          <div 
            class="user-item {selectedUser?.nickname === user.nickname ? 'selected' : ''}" 
            onclick={() => { selectedUser = user; errorMsg = ''; loginPin = ''; }}
            role="button"
            tabindex="0"
            onkeydown={(e) => { if(e.key === 'Enter') { selectedUser = user; errorMsg = ''; loginPin = ''; } }}
          >
            <div class="user-avatar-wrap">
              <img src={user.avatarImage} alt={user.nickname} />
            </div>
            <span class="user-nickname">{user.nickname}</span>
          </div>
        {/each}
      </div>

      {#if selectedUser}
        <div class="login-panel animate-float-small">
          <p><strong>{selectedUser.nickname}</strong>님의 PIN을 입력하세요</p>
          <div class="input-group">
            <input 
              type="password" 
              bind:value={loginPin} 
              placeholder="****" 
              maxlength="4" 
              inputmode="numeric" 
            />
          </div>
          <button class="btn btn-primary" onclick={login}>접속하기</button>
        </div>
      {/if}

      <div class="divider">
        <span>또는</span>
      </div>
      <button class="btn btn-secondary" onclick={() => { mode = 'register'; errorMsg = ''; }}>새로운 캐릭터 만들기</button>

    {:else}
      <h1 class="title">새 캐릭터 생성</h1>
      <p class="subtitle">얼굴을 맞춰 나만의 캐릭터를 만드세요!</p>

      <div class="avatar-section">
        {#if finalAvatarImage}
          <div class="final-avatar-preview" onclick={() => { finalAvatarImage = null; fileInput.click(); }} role="button" tabindex="0" onkeydown={(e) => { if(e.key === 'Enter') { finalAvatarImage = null; fileInput.click(); } }}>
            <img src={finalAvatarImage} alt="Final Avatar" />
          </div>
        {:else if rawImageSrc}
          <div class="cropper-container">
            <div 
              class="crop-window"
              onmousedown={startDrag}
              onmousemove={onDrag}
              onmouseup={stopDrag}
              onmouseleave={stopDrag}
              ontouchstart={startDrag}
              ontouchmove={onDrag}
              ontouchend={stopDrag}
              ontouchcancel={stopDrag}
              role="presentation"
            >
              <img 
                src={rawImageSrc} 
                alt="Raw Upload" 
                onload={onImgLoad}
                style="transform: translate({offsetX}px, {offsetY}px) scale({baseScale * userScale}) rotate({userRotation}deg);" 
                draggable="false"
              />
            </div>
            <button class="btn btn-secondary" onclick={generateAvatar}>캐릭터 모습 확인</button>
          </div>
        {:else}
          <div class="avatar-placeholder" onclick={() => fileInput.click()} role="button" tabindex="0" onkeydown={(e) => { if(e.key === 'Enter') fileInput.click(); }}>
            <span class="plus">+</span>
            <span>얼굴 사진 등록</span>
          </div>
        {/if}

        <input 
          type="file" 
          accept="image/*" 
          bind:this={fileInput} 
          onchange={handleFileUpload} 
          style="display: none;" 
        />
        <canvas bind:this={canvas} style="display: none;"></canvas>
      </div>

      <div class="input-section">
        <div class="input-group">
          <label for="nickname">닉네임</label>
          <input id="nickname" type="text" bind:value={nickname} placeholder="예: 워디마스터" maxlength="10" />
        </div>

        <div class="input-group">
          <label for="pin">PIN (4자리 숫자)</label>
          <input id="pin" type="password" bind:value={pin} placeholder="****" maxlength="4" inputmode="numeric" />
        </div>
      </div>

      <button class="btn btn-primary" onclick={register}>캐릭터 생성 후 시작</button>

      {#if appState.allUsers.length > 0}
        <button class="btn btn-text" onclick={() => { mode = 'login'; errorMsg = ''; }}>이전 화면으로 (캐릭터 선택)</button>
      {/if}
    {/if}

    {#if errorMsg}
      <p class="error">{errorMsg}</p>
    {/if}
  </div>
</div>

<style>
  .register-scene {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    overflow-y: auto;
  }

  .card {
    background: var(--color-surface);
    padding: 32px;
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    width: 90%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin: 24px 0;
  }

  .title {
    font-size: 28px;
    font-weight: 800;
    color: var(--color-text);
    margin: 0;
  }

  .subtitle {
    font-size: 14px;
    color: var(--color-text-muted, #666);
    margin: 0;
    text-align: center;
  }

  /* User List */
  .user-list {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    width: 100%;
    gap: 16px;
    padding: 12px 4px;
    justify-content: flex-start;
    -webkit-overflow-scrolling: touch;
  }

  .user-list::-webkit-scrollbar {
    height: 6px;
  }
  .user-list::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }

  .user-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    min-width: 80px;
    transition: transform 0.2s;
  }

  .user-item:active {
    transform: scale(0.95);
  }

  .user-avatar-wrap {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: #f0f0f0;
    overflow: hidden;
    border: 3px solid transparent;
    transition: border-color 0.2s;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .user-avatar-wrap img {
    width: 150%; /* show face only roughly */
    height: 150%;
    object-fit: cover;
    object-position: top;
  }

  .user-item.selected .user-avatar-wrap {
    border-color: var(--color-primary);
    box-shadow: 0 0 15px var(--color-border);
  }

  .user-nickname {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 80px;
  }

  .login-panel {
    width: 100%;
    background: #f8f9fa;
    padding: 16px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    border: 2px solid var(--color-border);
  }

  .login-panel p {
    margin: 0;
    font-size: 14px;
    color: #333;
  }

  .login-panel input {
    text-align: center;
    letter-spacing: 4px;
    font-size: 20px;
    width: 120px;
  }

  .divider {
    width: 100%;
    display: flex;
    align-items: center;
    text-align: center;
    color: #999;
    font-size: 12px;
    font-weight: 700;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #eee;
  }
  .divider span {
    padding: 0 10px;
  }

  @keyframes float-small {
    0% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
    100% { transform: translateY(0); }
  }
  .animate-float-small {
    animation: float-small 2s infinite ease-in-out;
  }

  /* Register Specific */
  .avatar-section {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .avatar-placeholder {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px dashed var(--color-border);
    cursor: pointer;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: var(--color-bg);
    transition: all 0.3s ease;
    color: var(--color-text-muted, #666);
    font-weight: 700;
    font-size: 12px;
    gap: 4px;
  }
  .avatar-placeholder .plus { font-size: 24px; }
  .avatar-placeholder:hover {
    border-color: var(--color-primary);
    transform: scale(1.05);
    color: var(--color-primary);
  }

  .final-avatar-preview {
    width: 150px;
    height: 200px;
    cursor: pointer;
    border-radius: 12px;
    border: 2px dashed transparent;
    transition: all 0.3s ease;
  }
  .final-avatar-preview:hover {
    border-color: var(--color-primary);
    transform: scale(1.05);
  }
  .final-avatar-preview img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .cropper-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .crop-window {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid var(--color-primary);
    overflow: hidden;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #eee;
    cursor: grab;
    touch-action: none; 
  }
  .crop-window:active { cursor: grabbing; }
  .crop-window img {
    max-width: none;
    pointer-events: none; 
    transform-origin: center center;
  }

  .input-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .input-group label {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
  }

  .input-group input {
    padding: 12px 16px;
    border-radius: 12px;
    border: 2px solid var(--color-border);
    font-size: 16px;
    outline: none;
    transition: border-color 0.2s;
  }
  .input-group input:focus { border-color: var(--color-primary); }

  .error {
    color: red;
    font-size: 14px;
    font-weight: 700;
    margin: 0;
  }

  /* Buttons */
  .btn {
    width: 100%;
    padding: 16px;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 800;
    border: none;
    cursor: pointer;
    transition: transform 0.2s, background-color 0.2s;
  }
  .btn:active { transform: scale(0.95); }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-secondary {
    background: #f1f5f9;
    color: #333;
    border: 2px solid #e2e8f0;
  }

  .btn-text {
    background: transparent;
    color: #666;
    text-decoration: underline;
    padding: 8px;
    font-size: 14px;
  }
</style>
