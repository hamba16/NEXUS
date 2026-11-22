from datetime import date
from decimal import Decimal

import pytest
from hypothesis import given
from hypothesis import strategies as st
from nexus.config import Settings
from nexus.domain import attainment, financial_period, transition
from pydantic import ValidationError


@pytest.mark.parametrize('day,expected', [('2026-11-22','FY2026/27 Q2'), ('2026-06-30','FY2025/26 Q4'), ('2026-07-01','FY2026/27 Q1'), ('2027-01-01','FY2026/27 Q3')])
def test_financial_period(day, expected):
    assert financial_period(date.fromisoformat(day)) == expected


@given(st.integers(min_value=1, max_value=1000000))
def test_target_attainment_is_green(value):
    result = attainment(Decimal(value), Decimal(value))
    assert result['attainment'] == '100.00'
    assert result['rag'] == 'GREEN'


@pytest.mark.parametrize('actual,rag', [(0,'RED'),(49,'RED'),(50,'AMBER'),(74,'AMBER'),(75,'GREEN'),(120,'GREEN')])
def test_rag_boundaries(actual, rag):
    assert attainment(Decimal(actual), Decimal(100))['rag'] == rag


@pytest.mark.parametrize('actual,target', [('NaN','100'),('10','0'),('-1','10'),('10','Infinity')])
def test_invalid_kpi_values(actual, target):
    with pytest.raises(ValueError):
        attainment(Decimal(actual), Decimal(target))


def test_lower_is_better():
    assert attainment(Decimal(10), Decimal(5), lower_is_better=True)['attainment'] == '50.00'
    assert attainment(Decimal(0), Decimal(5), lower_is_better=True)['rag'] == 'GREEN'


def test_transitions_reject_self_approval_and_skips():
    assert transition('DRAFT','submit','MDA_OFFICER') == 'SUBMITTED'
    assert transition('SUBMITTED','review','SECRETARIAT') == 'UNDER_REVIEW'
    assert transition('UNDER_REVIEW','accept','SECRETARIAT') == 'ACCEPTED'
    for state, action, role in [('DRAFT','accept','SECRETARIAT'),('UNDER_REVIEW','accept','MDA_OFFICER'),('ACCEPTED','return','SECRETARIAT'),('SUBMITTED','review','CONVENER')]:
        with pytest.raises(ValueError):
            transition(state,action,role)


def test_open_mode_guard():
    with pytest.raises(ValidationError):
        Settings(node_env='production', i_understand_open_mode=False, _env_file=None)
    assert Settings(node_env='production', i_understand_open_mode=True, _env_file=None).auth_mode == 'open'
    with pytest.raises(ValidationError):
        Settings(auth_mode='oidc', _env_file=None)


def test_directive_verifier_is_fail_closed():
    import subprocess
    result = subprocess.run(['python', 'seed/verify_directives.py'], capture_output=True, text=True)
    assert result.returncode != 0
    assert 'PUBLISHED DIRECTIVE VERIFICATION FAILED' in result.stdout + result.stderr


def test_config_rejects_wildcard_cors_and_sqlite():
    with pytest.raises(ValidationError):
        Settings(cors_origins=['*'], _env_file=None)
    with pytest.raises(ValidationError):
        Settings(database_url='sqlite://', _env_file=None)
