-- 문의 카테고리에 'suggestion'(제안) 추가. 푸터 "제안 보내기"가 이 유형으로 접수된다.
alter table public.inquiries drop constraint inquiries_category_check;
alter table public.inquiries
  add constraint inquiries_category_check
  check (category in ('general', 'suggestion', 'password'));
