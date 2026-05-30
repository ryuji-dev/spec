# 배포 — Oracle Cloud Always Free ARM VM

서경노회 교육위원회 홈페이지를 Oracle Cloud의 상시 무료 ARM VM 1대에 Docker Compose로 올인원 배포한다. (`web` + `postgres` + `caddy`)

## 1. VM 프로비저닝 (OCI 콘솔)

- **Shape**: `VM.Standard.A1.Flex` (ARM Ampere) — Always Free 한도 내 최대 **4 OCPU / 24GB RAM**
- **이미지**: Ubuntu LTS (aarch64)
- **스토리지**: 부팅 볼륨(최소 47GB) + 필요 시 블록 볼륨 (Always Free 합산 200GB)
- **네트워킹(보안 목록 / Ingress)**: **80·443만 개방**. SSH(22)는 본인 IP로 제한. **PostgreSQL 포트는 개방하지 않는다** (컨테이너 내부 네트워크 전용)

## 2. 서버 셋업

```bash
# Docker + compose plugin
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER   # 재로그인 후 적용

# 저장소 clone
git clone <repo-url> seogyeong && cd seogyeong
```

## 3. 환경 변수 (.env — 서버에서 직접 작성, 저장소에 올리지 않음)

루트에 `.env` 생성:

```dotenv
SITE_ADDRESS=교육위원회도메인.kr        # 지정 시 Caddy가 HTTPS 자동 발급
POSTGRES_USER=seogyeong
POSTGRES_PASSWORD=<강한 무작위 값>
POSTGRES_DB=seogyeong
DATABASE_URL=postgres://seogyeong:<위 비번>@postgres:5432/seogyeong
JWT_SECRET=<강한 무작위 값, openssl rand -base64 48>
```

> `.env`는 `.gitignore` 대상. 시크릿은 절대 커밋하지 않는다.

## 4. 기동

```bash
docker compose up -d --build
docker compose ps          # postgres healthy, web·caddy running 확인
docker compose logs -f web
```

- 도메인의 A 레코드를 VM 공인 IP로 연결하면 Caddy가 Let's Encrypt 인증서를 자동 발급한다.
- DB 마이그레이션·시드는 백엔드 구현(Phase 2~) 이후 절차를 이 문서에 추가한다.

## 5. 운영 체크리스트 (백엔드 가동 후 채울 것)

- [ ] PostgreSQL 정기 백업 (`pg_dump` cron → 블록 볼륨/Object Storage)
- [ ] 업로드 볼륨(`uploads`) 백업
- [ ] 로그 로테이션 / 위치 확인
- [ ] `JWT_SECRET` 로테이션 정책
- [ ] OCI 무료 한도 모니터링 (유휴 자원 회수 정책 주의)

---

> 현 시점(Phase 1)에서는 인프라 골격만 정의됨. 실제 배포·DB 마이그레이션 절차는 백엔드 구현 단계에서 보강한다.
