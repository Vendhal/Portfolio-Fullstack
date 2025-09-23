package com.example.portfolio.repo;

import com.example.portfolio.model.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Member findBySlug(String slug);
}
