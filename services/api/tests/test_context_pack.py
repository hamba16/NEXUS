import pytest
from seed.import_context_pack import slugify


def test_context_slug_is_stable():
    assert slugify('Crisis & Recovery / Uganda') == 'crisis-and-recovery-uganda'
