-- OAuth(Google·Kakao) 가입 시 메타데이터 키가 달라 이름이 비는 문제를 보강한다.
-- 우선순위: name → full_name → nickname(Kakao) → user_name → 이메일 local-part → '회원'.
-- role은 어떤 메타데이터도 신뢰하지 않고 항상 'member'(기존 정책 유지).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, title, church, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'nickname', ''),
      nullif(new.raw_user_meta_data->>'user_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      '회원'
    ),
    new.raw_user_meta_data->>'title',
    new.raw_user_meta_data->>'church',
    'member'
  );
  return new;
end;
$$;
