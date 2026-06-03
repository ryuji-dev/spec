# 배포 — Oracle Cloud Always Free ARM VM

완성된 앱(web + postgres + caddy)을 Oracle Cloud 상시 무료 **ARM 컴퓨트 VM 1대**에 Docker Compose로 올인원 배포한다.

> **중요:** 오라클의 관리형 DB(Autonomous Database)를 쓰지 않는다. PostgreSQL은 VM 안의 **Docker 컨테이너**로 직접 돌아간다. 오라클에서 "DB 생성"은 필요 없고, **ARM 컴퓨트 VM**만 있으면 된다. (이 compose 스택은 오라클 전용이 아니며 어떤 리눅스 호스트에서도 동일하게 동작한다.)

## 1. VM 프로비저닝 (OCI 콘솔)
- **Shape**: `VM.Standard.A1.Flex` (ARM Ampere) — Always Free 최대 4 OCPU / 24GB RAM
- **이미지**: Ubuntu LTS (aarch64), 부팅 볼륨 ≥ 47GB (Always Free 블록 합산 200GB)
- **보안 목록(Ingress)**: **80·443만 개방**, SSH(22)는 본인 IP로 제한. **PostgreSQL 포트는 개방 금지**(컨테이너 내부망 전용)
- 용량 부족("out of capacity") 시 다른 가용 도메인/리전 재시도 또는 시간차 재시도.

## 2. 서버 셋업
```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER   # 재로그인 후 적용
git clone <repo-url> seogyeong && cd seogyeong
```

## 3. 환경 변수 (.env — 서버에서 직접 작성, 커밋 금지)
루트에 `.env`:
```dotenv
SITE_ADDRESS=교육위원회도메인.kr        # 도메인 지정 시 Caddy가 HTTPS 자동 발급. 없으면 :80
POSTGRES_USER=seogyeong
POSTGRES_PASSWORD=<openssl rand -base64 36>
POSTGRES_DB=seogyeong
DATABASE_URL=postgres://seogyeong:<위 비번>@postgres:5432/seogyeong
JWT_SECRET=<openssl rand -base64 48>
SEED_ADMIN_EMAIL=admin@교육위원회도메인.kr
SEED_ADMIN_PASSWORD=<강한 무작위 값 — 최초 로그인 후 변경 권장>
```
> `.env`는 `.gitignore` 대상. 시크릿 커밋 금지.

## 4. 기동
```bash
docker compose up -d --build       # web·postgres·caddy 기동 (최초 빌드 — ARM 네이티브)
docker compose ps                  # postgres healthy, web·caddy running 확인
```

## 5. 마이그레이션 + 초기 admin (최초 1회 / 스키마 변경 시)
```bash
docker compose run --rm migrate    # migrate.mjs(스키마) → seed-admin.mjs(초기 admin)
```
- 멱등: 재실행해도 적용된 마이그레이션·기존 admin은 건너뛴다.
- 스키마 변경 배포 시: `git pull` → `docker compose up -d --build` → `docker compose run --rm migrate`.

## 6. 도메인·HTTPS
- DNS A 레코드를 VM 공인 IP로 연결. `SITE_ADDRESS`가 도메인이면 Caddy가 Let's Encrypt 인증서를 자동 발급(80/443 개방 필요).
- 확인: `https://<도메인>/`, `/committee`, `/resources`, `/login`(admin 로그인) → `/admin`.

## 7. 운영 체크리스트
- [ ] PostgreSQL 정기 백업: `docker compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql` (cron → 블록 볼륨/Object Storage)
- [ ] 업로드 볼륨 백업: `docker run --rm -v <프로젝트명>_uploads:/v -v $PWD:/b alpine tar czf /b/uploads.tgz -C /v .` (볼륨명은 `docker volume ls`로 확인 — compose 프로젝트 디렉터리명 접두)
- [ ] 로그 확인: `docker compose logs -f web` / `caddy`
- [ ] `JWT_SECRET` 로테이션 정책(로테이션 시 전 세션 무효화)
- [ ] OCI 무료 한도·유휴 자원 회수 정책 모니터링

## 8. 트러블슈팅
- web 컨테이너 DB 연결 실패: `.env`의 `DATABASE_URL` 호스트가 `postgres`(서비스명)인지 확인.
- 마이그레이션 에러: `docker compose run --rm migrate` 출력 확인. `__migrations` 테이블로 적용 이력 추적.
- `migrate` 명령이 비정상 종료(마이그레이션은 성공인데 종료 코드 ≠ 0): `seed-admin`이 `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` 미설정으로 멈춘 경우다. `.env`에 두 값을 지정 후 재실행(멱등).
- HTTPS 미발급: 80/443 개방·DNS 전파·`SITE_ADDRESS` 도메인 정확성 확인.
