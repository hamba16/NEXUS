from datetime import date
from decimal import Decimal


def financial_period(day: date) -> str:
    start = day.year if day.month >= 7 else day.year - 1
    quarter = ((day.month - 7) % 12) // 3 + 1
    return f'FY{start}/{str(start + 1)[2:]} Q{quarter}'


def attainment(actual: Decimal, target: Decimal, *, lower_is_better: bool = False) -> dict:
    if not actual.is_finite() or not target.is_finite() or actual < 0 or target <= 0:
        raise ValueError('Actual must be finite and non-negative; target must be finite and positive')
    ratio = (target / actual if actual else Decimal(1)) if lower_is_better else actual / target
    percent = (ratio * 100).quantize(Decimal('0.01'))
    return {'attainment': str(percent), 'variance': str(actual - target), 'rag': 'GREEN' if percent >= 75 else 'AMBER' if percent >= 50 else 'RED', 'formula': 'target / actual * 100' if lower_is_better else 'actual / target * 100'}


def transition(state: str, action: str, role: str) -> str:
    reviewers = {'DSEMR_ANALYST','MIU_ANALYST','CABINET_SECRETARIAT','APEX_SECRETARIAT','ACCOUNTING_OFFICER'}
    effective_role = 'REVIEWER' if role in reviewers else role
    transitions = {
        ('DRAFT', 'submit', 'MINISTRY_FOCAL'): 'SUBMITTED',
        ('RETURNED', 'submit', 'MINISTRY_FOCAL'): 'SUBMITTED',
        ('SUBMITTED', 'review', 'REVIEWER'): 'UNDER_REVIEW',
        ('AI_SUMMARISED', 'review', 'REVIEWER'): 'UNDER_REVIEW',
        ('UNDER_REVIEW', 'accept', 'REVIEWER'): 'ACCEPTED',
        ('UNDER_REVIEW', 'return', 'REVIEWER'): 'RETURNED',
    }
    try:
        return transitions[(state, action, effective_role)]
    except KeyError as exc:
        raise ValueError('Transition is not permitted from this state for this role') from exc
