import pytest
from seed.load_reference_data import slugify


def test_context_slug_is_stable():
    assert slugify('Crisis & Recovery / Uganda') == 'crisis-and-recovery-uganda'
