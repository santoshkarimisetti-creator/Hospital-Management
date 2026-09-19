from django.db import models
from django.conf import settings


class Member(models.Model):
    """
    Patient master profile / family member record.
    An account owner can create members for themselves and dependent family members.
    """
    GENDER_MALE = 'M'
    GENDER_FEMALE = 'F'
    GENDER_OTHER = 'O'
    GENDER_CHOICES = [
        (GENDER_MALE, 'Male'),
        (GENDER_FEMALE, 'Female'),
        (GENDER_OTHER, 'Other'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='members',
        help_text="Account owner who manages this patient profile"
    )
    full_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default=GENDER_MALE)
    date_of_birth = models.DateField(null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    custom_relation = models.CharField(max_length=100, blank=True, default='', help_text="Optional custom relationship (e.g. Father, Mother, Friend)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'members'
        verbose_name = 'Member'
        verbose_name_plural = 'Members'
        indexes = [
            models.Index(fields=['user', 'full_name']),
        ]

    def __str__(self):
        return f"{self.full_name} (Owner: {self.user.username})"


class Relationship(models.Model):
    """
    Defines relationship type between a Member profile and a User account.
    """
    REL_SELF = 'SELF'
    REL_FATHER = 'FATHER'
    REL_MOTHER = 'MOTHER'
    REL_SPOUSE = 'SPOUSE'
    REL_CHILD = 'CHILD'
    REL_SIBLING = 'SIBLING'
    REL_BROTHER = 'BROTHER'
    REL_SISTER = 'SISTER'
    REL_COUSIN = 'COUSIN'
    REL_AUNTY = 'AUNTY'
    REL_UNCLE = 'UNCLE'
    REL_FRIEND = 'FRIEND'
    REL_OTHER = 'OTHER'

    RELATIONSHIP_CHOICES = [
        (REL_SELF, 'Self'),
        (REL_FATHER, 'Father'),
        (REL_MOTHER, 'Mother'),
        (REL_SPOUSE, 'Spouse'),
        (REL_CHILD, 'Child'),
        (REL_BROTHER, 'Brother'),
        (REL_SISTER, 'Sister'),
        (REL_COUSIN, 'Cousin'),
        (REL_AUNTY, 'Aunty'),
        (REL_UNCLE, 'Uncle'),
        (REL_FRIEND, 'Friend'),
        (REL_OTHER, 'Other'),
    ]

    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='relationships'
    )
    related_to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='family_relationships'
    )
    relationship_type = models.CharField(
        max_length=30,
        choices=RELATIONSHIP_CHOICES,
        default=REL_SELF
    )
    custom_relation = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'relationships'
        verbose_name = 'Relationship'
        verbose_name_plural = 'Relationships'
        constraints = [
            models.UniqueConstraint(
                fields=['member', 'related_to_user'],
                name='unique_member_user_relationship'
            )
        ]

    def __str__(self):
        return f"{self.member.full_name} -> {self.related_to_user.username} ({self.relationship_type})"
